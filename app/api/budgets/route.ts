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
    const items = await prisma.budget.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET budgets error:', error);
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
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
    const item = await prisma.budget.create({
      data: {
        userId,
        category: body.category,
        limit: parseFloat(body.limit),
        spent: parseFloat(body.spent || 0),
        period: body.period || 'monthly',
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('POST budgets error:', error);
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 });
  }
}
