import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('bookId');

    if (!bookId) {
      return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
    }

    const entries = await prisma.journalEntry.findMany({
      where: { bookId },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Failed to fetch entries:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, title, content, mood, chapter, tags, bookId, date } = body;

    if (!bookId || !content) {
      return NextResponse.json({ error: 'bookId and content are required' }, { status: 400 });
    }

    const entry = await prisma.journalEntry.create({
      data: {
        userId: userId || 'user-1',
        title: title || 'Untitled Entry',
        content,
        mood,
        chapter,
        tags: tags || [],
        bookId,
        date: date ? new Date(date) : undefined,
      }
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Failed to create entry:', error);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}
