import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    let prompt = '';
    let imageParts: any[] = [];

    switch (action) {
      case 'refine-layman-notes': {
        const { noteContent } = body;
        prompt = `
          You are an expert notes organizer. You take messy, layman, stream-of-consciousness notes and refine them into a professional, highly readable format.
          Organize them with beautiful markdown headings, bullet points, checklists, and key highlights.
          Make the tone clear, professional, yet natural.
          Here are the notes:
          "${noteContent}"

          Respond strictly in valid JSON format. Do not use markdown code block wrappers around the JSON itself.
          Structure:
          {
            "refinedNotes": "Your beautifully refined markdown notes here"
          }
        `;
        break;
      }

      case 'refine-requirements': {
        const { laymanText } = body;
        prompt = `
          You are an expert Business Analyst and Tech Lead.
          Refine the following layman requirement into a structured technical specification:
          "${laymanText}"

          Respond strictly in valid JSON format with the following keys. Do not use markdown backticks:
          {
            "functionalReqs": ["array of refined functional requirements"],
            "nonFunctionalReqs": ["array of non-functional requirements like security, speed, scale"],
            "acceptanceCriteria": ["clear pass/fail criteria"],
            "userStories": ["formal User Stories like 'As a..., I want to..., So that...'"],
            "technicalSpecs": {
              "apis": ["suggested endpoints, e.g. GET /api/v1/resource"],
              "database": ["suggested collections/tables, fields, indexes"],
              "permissions": ["roles and permission levels needed"]
            },
            "edgeCases": ["possible edge cases to test"]
          }
        `;
        break;
      }

      case 'generate-test-cases': {
        const { functionalReqs, edgeCases } = body;
        prompt = `
          You are a Senior QA Engineer.
          Generate a detailed test plan based on these requirements and edge cases:
          Requirements: ${JSON.stringify(functionalReqs)}
          Edge Cases: ${JSON.stringify(edgeCases)}

          Respond strictly in valid JSON format as a list of test cases. Each item must look like:
          [
            {
              "title": "Clear concise test title",
              "description": "What this case tests",
              "testType": "functional" | "api" | "performance" | "security" | "edge-case",
              "steps": ["Step 1...", "Step 2...", "Step 3..."],
              "expectedResult": "Exactly what success looks like"
            }
          ]
          Do not include any markdown backticks. Return only the raw JSON.
        `;
        break;
      }

      case 'generate-flow-diagram': {
        const { functionalReqs } = body;
        prompt = `
          Create a flowchart or node-link structure representing the user journey, system workflow, and data flow for these requirements:
          "${JSON.stringify(functionalReqs)}"

          Respond strictly in valid JSON format. Do not use markdown backticks. Structure:
          {
            "userFlow": {
              "nodes": [{"id": "1", "label": "Start"}, {"id": "2", "label": "Action"}],
              "edges": [{"from": "1", "to": "2", "label": "clicks"}]
            },
            "systemFlow": {
              "nodes": [{"id": "1", "label": "Client"}, {"id": "2", "label": "API"}],
              "edges": [{"from": "1", "to": "2", "label": "fetch"}]
            },
            "dataFlow": {
              "nodes": [{"id": "1", "label": "Input"}, {"id": "2", "label": "DB"}],
              "edges": [{"from": "1", "to": "2", "label": "save"}]
            }
          }
        `;
        break;
      }

      case 'extract-meeting-notes': {
        const { transcript } = body;
        prompt = `
          Analyze the following client meeting transcript:
          "${transcript}"

          Extract a structured meeting summary. Respond strictly in valid JSON format. Do not use markdown backticks. Structure:
          {
            "summary": "1-2 sentence high-level overview",
            "decisions": ["Decision 1...", "Decision 2..."],
            "actionItems": [
              { "task": "Action description", "assignee": "Name or Role", "deadline": "date or 'TBD'" }
            ],
            "risks": ["Risk 1...", "Risk 2..."]
          }
        `;
        break;
      }

      case 'analyze-mistakes': {
        const { mistakes } = body;
        prompt = `
          Analyze this history of developer mistakes:
          ${JSON.stringify(mistakes)}

          Identify recurring patterns, trend alerts, and suggest concrete prevention strategies.
          Respond strictly in valid JSON format. Do not use markdown backticks. Structure:
          {
            "patternsDetected": ["Pattern 1...", "Pattern 2..."],
            "trendAlerts": ["Alert 1...", "Alert 2..."],
            "mitigationPlan": ["MITIGATION 1...", "MITIGATION 2..."]
          }
        `;
        break;
      }

      case 'analyze-visual-diff': {
        const { beforeImage, afterImage } = body;
        if (!beforeImage || !afterImage) {
          return NextResponse.json({ error: 'Before and After images are required' }, { status: 400 });
        }

        // We will call Gemini using a multimodal request
        const cleanBefore = beforeImage.replace(/^data:image\/\w+;base64,/, '');
        const cleanAfter = afterImage.replace(/^data:image\/\w+;base64,/, '');

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [
                { text: `Compare these two UI screenshots (Before is the first image, After is the second image). Identify any UI changes: elements added, removed, shifted, or modified (colors, alignment, text). Respond strictly in valid JSON format with structure: { "addedElements": ["list"], "removedElements": ["list"], "changedElements": ["list"] }. Do not use markdown backticks.` },
                { inlineData: { mimeType: 'image/png', data: cleanBefore } },
                { inlineData: { mimeType: 'image/png', data: cleanAfter } }
              ]
            }],
            generationConfig: { temperature: 0.1 }
          })
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`Gemini Image comparison failed: ${err}`);
        }

        const data = await response.json();
        let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        text = text?.replace(/```json/g, '').replace(/```/g, '').trim();
        return NextResponse.json(JSON.parse(text || '{}'));
      }

      case 'generate-financial-insights': {
        const { metrics } = body;
        prompt = `
          You are an expert AI Financial Planner and Wealth Coach.
          Analyze the following financial metrics for the user:
          - Currency: ${metrics.currency}
          - Net Worth: ${metrics.netWorth}
          - Monthly Income Setting/Actual: ${metrics.monthlyIncome}
          - Monthly Expenses: ${metrics.monthlyExpenses}
          - Portfolio Value: ${metrics.portfolioValue}
          - Total Invested Amount: ${metrics.totalInvested}
          - Total P&L: ${metrics.totalPnl}
          - Total Debt: ${metrics.totalDebt}
          - Savings Rate: ${metrics.savingsRate}%
          - Number of Active EMIs: ${metrics.emisCount}
          - Number of Savings Goals: ${metrics.goalsCount}
          - Number of Investments: ${metrics.investmentsCount}
          - Number of Transactions Logged: ${metrics.transactionsCount}

          Provide exactly 3 highly actionable, personalized financial recommendations/suggestions for the user.
          Since the user is using this dashboard to manage their life and wealth, make the suggestions highly contextual:
          - If their Net Worth, Portfolio, or transactions are 0, guide them on what concrete step to take first (e.g. logging a transaction, starting a savings goal, setting up a mock SIP, or using the settings panel to set their income baseline).
          - If their debt is high relative to income, suggest debt paydown strategies.
          - If their savings rate is high, suggest asset allocation or SIP setups.
          - Keep the tone encouraging, warm, and clear (like a friendly companion).

          Respond strictly in valid JSON format. Do not use markdown backticks or block wrappers around the JSON itself.
          Structure:
          {
            "insights": [
              {
                "title": "Clear short suggestion title",
                "content": "Actionable suggestion text...",
                "priority": "high" | "medium" | "low"
              }
            ]
          }
        `;
        break;
      }

      case 'generate-ecosystem-report': {
        const { partners } = body;
        prompt = `
          You are an expert Organizational Coach and Collaboration Consultant.
          Analyze the following statistics for the user's partner network (Ecosystem):
          ${JSON.stringify(partners)}

          Provide a detailed collaboration and ecosystem network analysis.
          Specifically:
          - Look at the number of active projects, goals, and tasks associated with each partner.
          - If there are no partners or very few, suggest how to start building an ecosystem (e.g. adding a team member, spouse, client, or supplier).
          - Provide positive feedback on strong partnerships.
          - Call out gaps (e.g. if a partner has projects but no active tasks, or has high priority but low engagement).
          
          Respond strictly in valid JSON format. Do not use markdown backticks or block wrappers around the JSON itself.
          Structure:
          {
            "summary": "1-2 sentence high-level summary of the ecosystem's strengths and areas for growth.",
            "strengths": ["Strength 1...", "Strength 2..."],
            "growthAreas": ["Gap or area for improvement 1...", "Gap or area for improvement 2..."],
            "actionItems": ["Action 1...", "Action 2...", "Action 3..."]
          }
        `;
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid AI action' }, { status: 400 });
    }

    // Call standard text Gemini API for other actions
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API Error:', response.status, err);
      throw new Error(`Gemini API Error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    text = text?.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(text || '{}');
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error('Failed to parse JSON response from Gemini:', text, parseError);
      return NextResponse.json({ error: 'AI returned invalid JSON format', raw: text }, { status: 500 });
    }
  } catch (error: any) {
    console.error('AI Suite Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
