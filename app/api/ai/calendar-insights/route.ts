import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action;
    const eventName = body.eventName;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    if (action === 'holiday-summary' && eventName) {
      const cacheKeyStr = `holiday-summary-${eventName}`;

      // 1. Lazy-Flush expired cache globally
      try {
        await prisma.$runCommandRaw({
          delete: 'AiCache',
          deletes: [{ q: { expiresAt: { $lt: { $date: new Date().toISOString() } } }, limit: 0 }]
        });
      } catch (e) { console.warn("Cache flush non-fatal error", e); }

      // 2. Check Active Cache
      try {
        const cacheMatch = await prisma.$runCommandRaw({
          find: 'AiCache',
          filter: { cacheKey: cacheKeyStr },
          limit: 1
        }) as any;
        
        const doc = cacheMatch?.cursor?.firstBatch?.[0];
        // If doc exists and hasn't expired, return it and bypass Gemini
        if (doc && new Date(doc.expiresAt) > new Date()) {
           console.log(`[AI Cache Hit] Returning cached summary for: ${eventName}`);
           return NextResponse.json({ summary: doc.summary, link: doc.link });
        }
      } catch (e) { console.error("Cache Read Error:", e); }

      const prompt = `Respond strictly in valid JSON format with keys 'summary' and 'link'. The summary should be 1-2 short sentences about what the holiday '${eventName}' is and why it is celebrated. The link should be a valid, highly informative URL (e.g., Wikipedia) for more details. Do not use markdown backticks in the response. Ensure it can be parsed by JSON.parse().`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error [holiday]:', response.status, errorText);
        throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      let textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textContent) {
        throw new Error('Invalid response from Gemini');
      }

      // Cleanup backticks if the model ignores the instruction
      textContent = textContent.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const parsed = JSON.parse(textContent);

        // 3. Populate Cache
        try {
          const expiresDate = new Date();
          expiresDate.setMonth(expiresDate.getMonth() + 1); // 1 Month Expiration
          
          await prisma.$runCommandRaw({
            update: 'AiCache',
            updates: [{ 
              q: { cacheKey: cacheKeyStr }, 
              u: { $set: { cacheKey: cacheKeyStr, summary: parsed.summary, link: parsed.link, type: 'holiday', expiresAt: { $date: expiresDate.toISOString() }, createdAt: { $date: new Date().toISOString() } } },
              upsert: true
            }]
          });
        } catch (e) { console.error("Cache Write Error:", e); }

        return NextResponse.json(parsed);
      } catch (parseError) {
        return NextResponse.json({ 
          summary: textContent, 
          link: `https://en.wikipedia.org/wiki/${encodeURIComponent(eventName)}` 
        });
      }
    } else if (action === 'animation-check') {
        const monthEvents = body.monthEvents || [];
        if (!Array.isArray(monthEvents) || monthEvents.length === 0) return NextResponse.json({ type: null });

        const prompt = `
          You are an AI for a calendar. Given this list of event titles for the current month, determine if there is a highly special personal milestone happening that warrants a top-screen animation (like a Birthday, Anniversary, or Wedding).
          Event Titles: ${monthEvents.join(", ")}
          
          Respond strictly in valid JSON with:
          { "type": "confetti" | "fireworks" | "balloons" | null }
          Return 'null' if there are no heavily celebratory milestones. Do not use markdown backticks.
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1 }
          })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error [animation]:', response.status, errorText);
            throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        text = text?.replace(/```json/g, '').replace(/```/g, '').trim();
        return NextResponse.json(JSON.parse(text || '{"type":null}'));
    }

    return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });
  } catch (error: any) {
    console.error('Calendar AI Insights Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
