import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { getCalendarEvents, createCalendarEvent, deleteCalendarEvent } from '@/lib/googleCalendar';

export const dynamic = 'force-dynamic';

async function performWebSearch(query: string): Promise<string> {
  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) return "Search failed.";
    const html = await response.text();
    
    const results: { title: string; url: string; snippet: string }[] = [];
    const resultBlockRegex = /<div class="result__body">([\s\S]*?)<\/div>/g;
    let match;
    let count = 0;
    
    while ((match = resultBlockRegex.exec(html)) !== null && count < 5) {
      const block = match[1];
      const titleMatch = /<a class="result__a"[^>]*?href="([^"]*?)"[^>]*?>([\s\S]*?)<\/a>/.exec(block);
      const snippetMatch = /<a class="result__snippet"[^>]*?>([\s\S]*?)<\/a>/.exec(block);
      
      if (titleMatch) {
        const url = titleMatch[1];
        const title = titleMatch[2].replace(/<[^>]*?>/g, '').trim();
        const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*?>/g, '').trim() : "";
        
        let cleanUrl = url;
        if (url.includes('uddg=')) {
          try {
            const urlParams = new URLSearchParams(url.split('?')[1]);
            cleanUrl = urlParams.get('uddg') || url;
          } catch (e) {}
        }
        
        results.push({ title, url: cleanUrl, snippet });
        count++;
      }
    }
    
    if (results.length === 0) {
      return "No search results found.";
    }
    
    return results.map((r, i) => `[${i+1}] Title: ${r.title}\nURL: ${r.url}\nSummary: ${r.snippet}`).join("\n\n");
  } catch (err: any) {
    console.error("Web Search error:", err);
    return `Search error: ${err.message}`;
  }
}

async function parseAndLearnURL(url: string, userId: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) return `Failed to fetch URL ${url}.`;
    const rawHtml = await res.text();
    
    const titleMatch = /<title[^>]*?>([\s\S]*?)<\/title>/i.exec(rawHtml);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*?>/g, '').trim() : `Learned Link`;
    
    let bodyText = rawHtml
      .replace(/<script[^>]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*?>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*?>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
      
    const maxSnippetLength = 4000;
    const truncatedBody = bodyText.length > maxSnippetLength ? bodyText.slice(0, maxSnippetLength) + "..." : bodyText;
    
    const createdNote = await prisma.note.create({
      data: {
        userId,
        title: `[Learned] ${title}`,
        content: `Learned from URL: ${url}\n\nFull parsed content:\n${bodyText}`,
        folder: "Learned",
        tags: ["learned", "web-fetch"]
      }
    });
    
    return `Successfully fetched URL "${url}" and saved it to your smart notes folder "Learned" as "[Learned] ${title}". Here is the cleaned parsed content snippet from the page:\n\n${truncatedBody}\n\n`;
  } catch (e: any) {
    console.error(`Failed to learn from URL ${url}:`, e);
    return `Failed to parse URL "${url}": ${e.message}\n`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const { message, history = [], currentPage = 'dashboard', latitude, longitude, aiName = 'Potato', aiLanguage = 'Auto-detect', isCallMode = false } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    // 1. Fetch Geolocation Weather context if coordinates are available
    let weatherInfo = "";
    if (latitude !== undefined && longitude !== undefined) {
      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code`;
        const weatherRes = await fetch(weatherUrl);
        if (weatherRes.ok) {
          const weatherData = await weatherRes.json();
          const current = weatherData.current;
          weatherInfo = `Current Weather at user coordinates (${latitude}, ${longitude}):
- Temperature: ${current.temperature_2m}°C
- Apparent Temperature: ${current.apparent_temperature}°C
- Humidity: ${current.relative_humidity_2m}%
- Precipitation: ${current.precipitation} mm
- Weather Code: ${current.weather_code}`;
        }
      } catch (err) {
        console.error("Failed to query weather:", err);
      }
    }

    // 2. Fetch URLs to learn
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = message.match(urlRegex);
    let learnedContext = "";
    if (urls && urls.length > 0) {
      for (const url of urls) {
        const learnResult = await parseAndLearnURL(url, userId);
        learnedContext += learnResult + "\n";
      }
    }

    // 3. Fetch RAG Context (Active Tasks, Goals, Habits, Mistakes, Notes, Google Calendar)
    const timeMin = new Date();
    timeMin.setHours(0,0,0,0);
    const timeMax = new Date(timeMin);
    timeMax.setDate(timeMax.getDate() + 7);

    const [tasks, goals, habits, mistakes, notes, googleCalEvents] = await Promise.all([
      prisma.task.findMany({
        where: { userId, status: { not: 'completed' }, deletedAt: null },
        orderBy: { priorityScore: 'desc' },
        take: 10
      }),
      prisma.goal.findMany({
        where: { userId, status: 'active', deletedAt: null },
        include: { milestones: true },
        take: 5
      }),
      prisma.habit.findMany({
        where: { userId, deletedAt: null },
        include: { checkins: true },
        take: 10
      }),
      prisma.mistake.findMany({
        where: { userId, projectId: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.note.findMany({
        where: { userId, folder: { not: 'Trash' } },
        select: { id: true, title: true, tags: true, folder: true, backlinks: true },
        take: 15
      }),
      getCalendarEvents(timeMin, timeMax)
    ]);

    const tasksText = tasks.length > 0 
      ? tasks.map(t => `- [Score: ${t.priorityScore}] ${t.title} (${t.status}, due: ${t.dueDate?.toDateString() || "No due date"})`).join("\n")
      : "No active tasks.";

    const goalsText = goals.length > 0
      ? goals.map(g => `- ${g.title} (${g.progress}% complete, milestones: ${g.milestones.map(m => `${m.title} [${m.completed ? "Done" : "Pending"}]`).join(", ")})`).join("\n")
      : "No active goals.";

    const habitsText = habits.length > 0
      ? habits.map(h => `- ${h.title}: streak ${h.streak}d (longest: ${h.longestStreak}d, total completions: ${h.checkins.length}, freq: ${h.frequency})`).join("\n")
      : "No active habits.";

    const mistakesText = mistakes.length > 0
      ? mistakes.map(m => `- [Severity: ${m.severity}] ${m.title}: Root Cause: "${m.rootCause}", Prevention: "${m.preventionStrategy}"`).join("\n")
      : "No mistakes logged yet.";

    const notesText = notes.length > 0
      ? notes.map(n => `- Note: "${n.title}" in folder "${n.folder}" (Tags: ${n.tags.join(", ") || "none"}, Backlinks: ${n.backlinks.join(", ") || "none"})`).join("\n")
      : "No notes logged yet.";

    const calendarText = googleCalEvents && googleCalEvents.length > 0
      ? googleCalEvents.map((ev: any) => {
          const startStr = ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleString() : ev.start?.date || "No start time";
          const endStr = ev.end?.dateTime ? new Date(ev.end.dateTime).toLocaleString() : ev.end?.date || "No end time";
          return `- Event: "${ev.summary || "Untitled"}" (${startStr} to ${endStr}) [ID: ${ev.id}]${ev.description ? ` - Desc: ${ev.description}` : ""}`;
        }).join("\n")
      : "No upcoming Google Calendar events.";

    // 4. Compile dynamic prompt context
    const currentDateTime = new Date().toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const systemInstruction = `You are ${aiName}, the user's personal companion for Life OS.
You are friendly, empathetic, and write in a warm, handwritten journal conversational style.

Languages & Dialects:
- You speak English, Hindi, and Gujarati natively.
- You support code-switching and bilingual conversations. 
- If the user writes in Hindi or Hinglish (Hindi written in Roman text, e.g. "aaj ka plan kya hai?"), reply in fluent Hinglish/Hindi.
- If the user writes in Gujarati or Gujlish (Gujarati in Roman text, e.g. "aaje shu kam chhe?"), reply in fluent Gujlish/Gujarati.
- You are future-ready for other languages like Japanese. If the user communicates in Japanese or another language, respond fluently in that language.
- Current language preference setting: ${aiLanguage}. If not "Auto-detect", prioritize this preference where natural.

Grounding & Behavior Rules:
- Today's date/time is: ${currentDateTime}.
- User is currently viewing the page: ${currentPage}.
- Reference the user's data below when answering questions about their tasks, goals, habits, finances, or mistakes. Refer to the data naturally without citing internal database labels.
- Learning & Patterns: Read the user's mistakes, habits, and notes backlinks to learn their patterns. Warn them of potential repeating patterns or bad decisions. Assist them in connecting knowledge concepts (using note backlinks graph structure) and recommend custom roadmaps tailored to their tech stacks.
- Web Search Capability: You can search the live web for current events, news, or general real-time queries. If you need to search the web to answer the user's request, you MUST output '[WANTED_SEARCH: query]' on a single line at the very beginning of your response. The system will detect this, query the search engine, and run another invocation with the search results. DO NOT add any markdown formatting before '[WANTED_SEARCH: query]'.
- Google Calendar Integration: You can view, create, or delete calendar events.
  - If the user asks you to schedule a meeting, create an event, or add something to their calendar, you MUST output '[CALENDAR_CREATE: Title | Description | StartDateTime | EndDateTime]' on a single line at the very beginning of your response. E.g., '[CALENDAR_CREATE: Team Meeting | Project review session | 2026-06-22T14:00:00+05:30 | 2026-06-22T15:00:00+05:30]'.
  - If the user asks you to remove, cancel, or delete a calendar event, you MUST output '[CALENDAR_DELETE: EventId]' on a single line at the very beginning of your response. E.g., '[CALENDAR_DELETE: a1b2c3d4e5f6]'.
  - The times must be formatted in ISO 8601 (YYYY-MM-DDTHH:MM:SS+Offset) relative to today's date/time. DO NOT add any markdown formatting before these commands.
- Settings Customization: You can directly change application appearance and companion settings (fonts, sizes, voices, avatars, language, and companion name) at the user's request.
  - When the user asks you to change a setting, you MUST append '[SETTING: type | value]' on a new line at the very end of your response.
  - Supported Setting commands:
    - Font Family: '[SETTING: font-family | kalam | caveat | indie | patrick | architects]' (If user asks for a font style we do not have, reply: "Sorry, but I think we don't have this font. We have Kalam, Caveat, Indie Flower, Patrick Hand, and Architects Daughter." and DO NOT output any setting tag).
    - Font Size: '[SETTING: font-size | <newValue>]' where <newValue> is an absolute pixel size (12 to 24) or a relative change. E.g., if user says "make the font size a little bit higher", output '[SETTING: font-size | +2]'. If "make it higher", output '[SETTING: font-size | +4]'. If "make it much higher", output '[SETTING: font-size | +6]'. If "make it to 20px", output '[SETTING: font-size | 20]'.
    - Voice Model: '[SETTING: voice | Mei | Ansh | Mary]'
    - Companion Avatar: '[SETTING: avatar | classic | sakura | ansh | mary]'
    - Preferred Language: '[SETTING: language | Auto-detect | English | Hindi | Gujarati | Japanese]'
    - Companion Name: '[SETTING: name | <newName>]'
  - Respond warmly to settings changes, mentioning that you are applying the transition or font magic and that you value their feedback.

${weatherInfo ? `\nWEATHER:\n${weatherInfo}\n` : ""}
${learnedContext ? `\nLEARNED WEB LINKS CONTEXT:\n${learnedContext}\n` : ""}
USER ACTIVE TASKS:
${tasksText}

USER ACTIVE GOALS:
${goalsText}

USER HABITS & STREAKS:
${habitsText}

USER CURRENT CALENDAR SCHEDULE (Next 7 Days):
${calendarText}

USER MISTAKES & ROOT CAUSES (For pattern warning):
${mistakesText}

USER KNOWLEDGE NOTES GRAPH:
${notesText}
`;

    // 5. Map conversational history ensuring role alternation (user -> model -> user...)
    const contents: any[] = [];
    for (const msg of history) {
      const role = msg.role === 'user' ? 'user' : 'model';
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += "\n" + msg.content;
      } else {
        contents.push({
          role,
          parts: [{ text: msg.content }]
        });
      }
    }

    // Add current user message
    if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });
    } else {
      contents[contents.length - 1].parts[0].text += "\n" + message;
    }

    // Append strict Call Mode prompt rules if active
    let finalSystemInstruction = systemInstruction;
    if (isCallMode) {
      finalSystemInstruction += `\n\nCRITICAL VOICE CALL MODE RULES:
- The user is in a voice call with you. Speak naturally, warmly, and very concisely.
- Your response MUST be exactly ONE short sentence (maximum 15-20 words). Never output multiple sentences, paragraphs, or lists.
- Do NOT use any markdown formatting, bullet points, asterisks (** or *), lists, or headers. Output plain conversational text only.
- Settings adjustment tags (e.g., [SETTING: ...]) are still allowed and should be placed at the very end of your response if needed.
- Keep the interaction highly focused and responsive.`;
    }

    // 6. Query Gemini API initially
    let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: finalSystemInstruction }]
        },
        generationConfig: {
          temperature: isCallMode ? 0.15 : 0.4,
          maxOutputTokens: isCallMode ? 60 : 800
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API Error in /api/ai/chat:', response.status, err);
      throw new Error(`Gemini API Error: ${response.status} - ${err}`);
    }

    let data = await response.json();
    let reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    // 7. Check if Gemini requested an autonomous web search or calendar action
    const searchMatch = /\[WANTED_SEARCH:\s*([^\]]+)\]/.exec(reply);
    const calCreateMatch = /\[CALENDAR_CREATE:\s*([^|\]]+)(?:\|\s*([^|\]]*))?\|\s*([^|\]]+)\|\s*([^\]]+)\]/.exec(reply);
    const calDeleteMatch = /\[CALENDAR_DELETE:\s*([^\]]+)\]/.exec(reply);

    if (searchMatch) {
      const searchQuery = searchMatch[1].trim();
      console.log(`AI Companion requested web search: "${searchQuery}"`);
      
      const searchResults = await performWebSearch(searchQuery);
      const updatedSystemInstruction = finalSystemInstruction + `\n\nWEB SEARCH RESULTS FOR "${searchQuery}":\n${searchResults}\n\nPlease analyze these search results and reply to the user's original query: "${message}".`;
      
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: updatedSystemInstruction }]
          },
          generationConfig: {
            temperature: isCallMode ? 0.15 : 0.3,
            maxOutputTokens: isCallMode ? 60 : 800
          }
        })
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('Gemini API Search Re-query Error:', response.status, err);
        throw new Error(`Gemini API Search Re-query Error: ${response.status} - ${err}`);
      }

      data = await response.json();
      reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I encountered an issue parsing the search results.";
    } else if (calCreateMatch) {
      const summary = calCreateMatch[1].trim();
      const description = (calCreateMatch[2] || '').trim();
      const startDT = calCreateMatch[3].trim();
      const endDT = calCreateMatch[4].trim();
      
      console.log(`AI Companion creating calendar event: "${summary}" (${startDT} to ${endDT})`);
      
      const createdEvent = await createCalendarEvent({
        summary,
        description,
        start: { dateTime: startDT },
        end: { dateTime: endDT }
      });
      
      const resultText = createdEvent 
        ? `Successfully created Google Calendar event "${summary}" with ID: ${createdEvent.id}.`
        : `Failed to create Google Calendar event. The user might be unauthenticated or using a demo account.`;
        
      const updatedSystemInstruction = finalSystemInstruction + `\n\nCALENDAR ACTION RESULT:\n${resultText}\n\nPlease formulate a conversational reply letting the user know the outcome of the scheduling request.`;
      
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: updatedSystemInstruction }]
          },
          generationConfig: {
            temperature: isCallMode ? 0.15 : 0.3,
            maxOutputTokens: isCallMode ? 60 : 800
          }
        })
      });
      
      if (response.ok) {
        data = await response.json();
        reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || reply;
      }
    } else if (calDeleteMatch) {
      const eventId = calDeleteMatch[1].trim();
      console.log(`AI Companion deleting calendar event: "${eventId}"`);
      
      const deleteResult = await deleteCalendarEvent(eventId);
      const resultText = deleteResult.success
        ? `Successfully deleted Google Calendar event with ID: ${eventId}.`
        : `Failed to delete Google Calendar event with ID: ${eventId}. The event may not exist or the user is unauthenticated.`;
        
      const updatedSystemInstruction = finalSystemInstruction + `\n\nCALENDAR ACTION RESULT:\n${resultText}\n\nPlease formulate a conversational reply letting the user know the outcome of the deletion request.`;
      
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: updatedSystemInstruction }]
          },
          generationConfig: {
            temperature: isCallMode ? 0.15 : 0.3,
            maxOutputTokens: isCallMode ? 60 : 800
          }
        })
      });
      
      if (response.ok) {
        data = await response.json();
        reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || reply;
      }
    }

    return NextResponse.json({ response: reply });
  } catch (error: any) {
    console.error('AI Chat API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
