import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoalCategory, LifeArea } from '@/types';

// Hardcode user for now (consistent with tasks/habits)
const MOCK_USER_ID = 'user-1';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lifeArea = searchParams.get('lifeArea') as LifeArea | 'all' | null;
    const category = searchParams.get('category') as GoalCategory | 'all' | null;
    const status = searchParams.get('status') as string | 'all' | null;
    const search = searchParams.get('search');

    // Build the query
    const where: any = {
      userId: MOCK_USER_ID,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    };

    if (lifeArea && lifeArea !== 'all') where.lifeArea = lifeArea;
    if (category && category !== 'all') where.category = category;
    if (status && status !== 'all') where.status = status;
    
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const goals = await prisma.goal.findMany({
      where,
      include: {
        milestones: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      goals,
      total: goals.length,
      page: 1,
      totalPages: 1
    });
  } catch (error: any) {
    console.error('Failed to fetch goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { 
      title, description, lifeArea, category, targetDate, 
      impact, sharedWithPartner, milestones 
    } = data;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    let aiQuote = null;
    // Condition for a "small" goal to fill empty space
    if ((!milestones || milestones.length === 0) && !description) {
      try {
        const quoteRes = await fetch('https://zenquotes.io/api/random', { cache: 'no-store' });
        if (quoteRes.ok) {
          const quoteData = await quoteRes.json();
          if (quoteData && quoteData.length > 0 && quoteData[0].q) {
            aiQuote = `"${quoteData[0].q}" - ${quoteData[0].a}`;
          }
        }
      } catch (err) {
        console.error('Failed to fetch quote:', err);
      }
    }

    // Create Goal, potentially with nested Milestones
    const goal = await prisma.goal.create({
      data: {
        userId: MOCK_USER_ID,
        title,
        description,
        lifeArea: lifeArea || 'career',
        category: category || 'short-term',
        targetDate: targetDate ? new Date(targetDate) : null,
        status: 'active',
        impact: impact || 5,
        progress: 0,
        aiQuote,
        sharedWithPartner: sharedWithPartner || false,
        milestones: milestones && milestones.length > 0 ? {
          create: milestones.map((m: any) => ({
            title: m.title,
            completed: false,
          }))
        } : undefined
      },
      include: {
        milestones: true
      }
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create goal:', error);
    return NextResponse.json({ error: error.message || 'Failed to create goal' }, { status: 500 });
  }
}
