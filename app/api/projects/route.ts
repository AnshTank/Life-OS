import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/projects
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: any = { userId: 'user-1' }; // Hardcoded user for now

    if (status && status !== 'all') {
      where.status = status;
    }
    if (type && type !== 'all') {
      where.type = type;
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/projects
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title, description, type, status, techStack,
      startDate, targetDate, completedDate,
      progress, hoursSpent, earnings, clientName,
      repositoryUrl, demoUrl, notes, tasks
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        userId: 'user-1',
        title: title.trim(),
        description: description?.trim() || '',
        type: type || 'personal',
        status: status || 'idea',
        techStack: techStack || [],
        startDate: startDate ? new Date(startDate) : null,
        targetDate: targetDate ? new Date(targetDate) : null,
        completedDate: completedDate ? new Date(completedDate) : null,
        progress: progress || 0,
        hoursSpent: hoursSpent || 0,
        earnings: earnings || null,
        clientName: clientName || null,
        repositoryUrl: repositoryUrl || null,
        demoUrl: demoUrl || null,
        notes: notes || [],
        tasks: tasks || [],
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
