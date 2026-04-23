import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const journals = await prisma.journalBook.findMany({
      include: {
        _count: {
          select: { entries: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(journals);
  } catch (error) {
    console.error('Failed to fetch journals:', error);
    return NextResponse.json({ error: 'Failed to fetch journals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, ownerName, purpose, startedAt, chapters } = body;

    const journal = await prisma.journalBook.create({
      data: {
        name,
        ownerName,
        purpose,
        startedAt: startedAt ? new Date(startedAt) : undefined,
        chapters: chapters || [],
      }
    });

    return NextResponse.json(journal);
  } catch (error) {
    console.error('Failed to create journal:', error);
    return NextResponse.json({ error: 'Failed to create journal' }, { status: 500 });
  }
}
