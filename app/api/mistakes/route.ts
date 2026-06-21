import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/mistakes
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    const where: any = { userId };

    if (projectId && projectId !== 'none' && projectId !== 'null') {
      where.projectId = projectId;
    }

    const mistakes = await prisma.mistake.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(mistakes);
  } catch (error) {
    console.error('Failed to fetch mistakes:', error);
    return NextResponse.json({ error: 'Failed to fetch mistakes' }, { status: 500 });
  }
}

// POST /api/mistakes
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const { title, description, rootCause, severity, category, preventionStrategy, projectId } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const mistake = await prisma.mistake.create({
      data: {
        userId,
        title: title.trim(),
        description: description || '',
        rootCause: rootCause || '',
        severity: severity || 'medium',
        category: category || 'technical',
        preventionStrategy: preventionStrategy || '',
        projectId: (projectId && projectId !== 'none') ? projectId : null,
      },
    });

    return NextResponse.json(mistake, { status: 201 });
  } catch (error) {
    console.error('Failed to create mistake:', error);
    return NextResponse.json({ error: 'Failed to create mistake' }, { status: 500 });
  }
}
