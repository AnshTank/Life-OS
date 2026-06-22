import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
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
    const { title, messages } = body;

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title: title || 'New Conversation',
        messages: messages || [],
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}

// DELETE /api/ai/conversations - Delete conversations in a date range (IST timezone)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get('startDate'); // format "YYYY-MM-DD"
    const endDateStr = searchParams.get('endDate');     // format "YYYY-MM-DD"

    if (!startDateStr && !endDateStr) {
      return NextResponse.json({ error: 'At least one date (startDate or endDate) is required' }, { status: 400 });
    }

    // Convert IST date strings to UTC bounds
    // IST offset is UTC+5.5 hours (19800000 milliseconds)
    const where: any = { userId };
    const dateRange: any = {};

    if (startDateStr) {
      const [y, m, d] = startDateStr.split('-').map(Number);
      const istStartMs = Date.UTC(y, m - 1, d, 0, 0, 0);
      const startUTC = new Date(istStartMs - 19800000);
      dateRange.gte = startUTC;
    }

    if (endDateStr) {
      const [y, m, d] = endDateStr.split('-').map(Number);
      const istEndMs = Date.UTC(y, m - 1, d, 23, 59, 59, 999);
      const endUTC = new Date(istEndMs - 19800000);
      dateRange.lte = endUTC;
    }

    where.updatedAt = dateRange;

    const deleted = await prisma.conversation.deleteMany({
      where,
    });

    return NextResponse.json({ success: true, count: deleted.count });
  } catch (error) {
    console.error('Failed to bulk delete conversations:', error);
    return NextResponse.json({ error: 'Failed to delete conversations' }, { status: 500 });
  }
}
