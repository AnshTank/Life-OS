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
    const items = await prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET savings-goals error:', error);
    return NextResponse.json({ error: 'Failed to fetch savings goals' }, { status: 500 });
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
    const item = await prisma.savingsGoal.create({
      data: {
        userId,
        name: body.name,
        targetAmount: parseFloat(body.targetAmount),
        currentSaved: parseFloat(body.currentSaved || 0),
        deadline: body.deadline ? new Date(body.deadline) : null,
        priority: body.priority || 'medium',
        color: body.color || '#7a9eb8',
        icon: body.icon || null,
        monthlySavingTarget: body.monthlySavingTarget ? parseFloat(body.monthlySavingTarget) : null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('POST savings-goals error:', error);
    return NextResponse.json({ error: 'Failed to create savings goal' }, { status: 500 });
  }
}
