import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/habits — Fetch all active habits for the user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { searchParams } = new URL(req.url);
    const lifeArea = searchParams.get('lifeArea');
    const search = searchParams.get('search');

    // Build the non-deleted filter compatible with MongoDB
    const notDeletedFilter = {
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      userId,
      ...notDeletedFilter,
    };

    if (lifeArea && lifeArea !== 'all') {
      where.lifeArea = lifeArea;
    }

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const habits = await prisma.habit.findMany({
      where,
      include: {
        checkins: {
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ habits });
  } catch (error) {
    console.error('Failed to fetch habits:', error);
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
  }
}

// POST /api/habits — Create a new habit
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const { 
      title, description, lifeArea, frequency, targetDays, color, icon, reminderTime,
      habitType, targetValue, unit, unitIcon
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const habit = await prisma.habit.create({
      data: {
        userId,
        title,
        description,
        lifeArea: lifeArea || 'health',
        frequency: frequency || 'daily',
        targetDays: targetDays || 7,
        color: color || '#3b82f6',
        icon: icon || 'activity',
        reminderTime,
        habitType: habitType || 'boolean',
        targetValue: habitType === 'quantifiable' ? (targetValue || 1) : null,
        unit: habitType === 'quantifiable' ? (unit || 'unit') : null,
        unitIcon: habitType === 'quantifiable' ? (unitIcon || 'glass') : null,
      },
      include: {
        checkins: true,
      },
    });

    return NextResponse.json(habit, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create habit:', error);
    return NextResponse.json({ error: error.message || 'Failed to create habit' }, { status: 500 });
  }
}
