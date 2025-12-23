import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://zenquotes.io/api/today', {
      headers: {
        'User-Agent': 'Life-OS/1.0'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch quote')
    }
    
    const data = await response.json()
    
    return NextResponse.json({
      quote: data[0]?.q || "Every day is a new opportunity to become the best version of yourself.",
      author: data[0]?.a || "Life OS"
    })
  } catch (error) {
    console.error('Quote fetch error:', error)
    
    // Fallback quotes if API fails
    const fallbackQuotes = [
      { quote: "Your only limit is your mind.", author: "Life OS" },
      { quote: "Progress, not perfection.", author: "Life OS" },
      { quote: "Every small step counts.", author: "Life OS" },
      { quote: "You're building something amazing.", author: "Life OS" },
      { quote: "Consistency beats perfection.", author: "Life OS" }
    ]
    
    const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]
    
    return NextResponse.json(randomQuote)
  }
}