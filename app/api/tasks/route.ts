import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

function computePriorityScore(impact: number, urgency: number, effort: number): number {
  return Math.round((impact * 0.4 + urgency * 0.4 + (10 - effort) * 0.2) * 10) / 10;
}

// GET /api/tasks — paginated, filtered, sorted
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const lifeArea = searchParams.get('lifeArea');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'priority';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    // Find all partners representing this user to fetch shared tasks
    const userEmail = session.user.email;
    const partnerOrFilters: any[] = [{ linkedUserId: userId }];
    if (userEmail) {
      partnerOrFilters.push({ email: { equals: userEmail, mode: 'insensitive' } });
    }
    const matchingPartners = await prisma.partner.findMany({
      where: { OR: partnerOrFilters },
      select: { id: true }
    });
    const partnerIds = matchingPartners.map(p => p.id);

    const notDeleted = { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] };
    const ownershipOrSharing = [
      { userId },
      {
        sharedWithPartner: true,
        partnerId: { in: partnerIds }
      }
    ];

    const where: any = {
      AND: [
        notDeleted,
        { OR: ownershipOrSharing }
      ]
    };

    if (status && status !== 'all') {
      where.AND.push({ status });
    }
    if (lifeArea && lifeArea !== 'all') {
      where.AND.push({ lifeArea });
    }
    if (search) {
      where.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    // Build orderBy
    let orderBy: Record<string, string> = {};
    switch (sortBy) {
      case 'priority':
        orderBy = { priorityScore: 'desc' };
        break;
      case 'dueDate':
        orderBy = { dueDate: 'asc' };
        break;
      case 'created':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { priorityScore: 'desc' };
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json({
      tasks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/tasks — create single task
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const {
      title, description, lifeArea, goalId,
      impact = 5, urgency = 5, effort = 5,
      dueDate, scheduledFor, reminderAt,
      status = 'todo', isRecurring = false, recurringPattern,
      tags = [], sharedWithPartner = false,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const priorityScore = computePriorityScore(impact, urgency, effort);

    const task = await prisma.task.create({
      data: {
        userId,
        title: title.trim(),
        description: description?.trim() || null,
        lifeArea: lifeArea || 'career',
        goalId: goalId || null,
        impact,
        urgency,
        effort,
        priorityScore,
        dueDate: dueDate ? new Date(dueDate) : null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        reminderAt: reminderAt ? new Date(reminderAt) : null,
        status,
        isRecurring,
        recurringPattern: recurringPattern || null,
        tags,
        sharedWithPartner,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
