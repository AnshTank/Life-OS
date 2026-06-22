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
    const items = await prisma.purchaseLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET purchase-logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase logs' }, { status: 500 });
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
    const item = await prisma.purchaseLog.create({
      data: {
        userId,
        name: body.name,
        amount: parseFloat(body.amount),
        date: body.date ? new Date(body.date) : new Date(),
        category: body.category || 'other',
        satisfactionRating: parseInt(body.satisfactionRating || 5),
        notes: body.notes || null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('POST purchase-logs error:', error);
    return NextResponse.json({ error: 'Failed to create purchase log' }, { status: 500 });
  }
}
