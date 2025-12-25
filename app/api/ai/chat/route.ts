import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const systemPrompt = `You are Nexus AI, a personal life coach and assistant for the Nexus Life OS app. 
    You have access to the user's goals, tasks, progress, and life data. Be encouraging, insightful, and actionable.
    
    User Context: ${JSON.stringify(context, null, 2)}
    
    Respond in a friendly, motivational tone. Keep responses concise but helpful.`

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `User message: ${message}` }
    ])

    const response = await result.response
    const text = response.text()

    return NextResponse.json({ 
      message: text,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI Assistant Error:', error)
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    )
  }
}