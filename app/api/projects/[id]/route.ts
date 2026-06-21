import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    // Try finding by ID first, then by Slug
    const project = await prisma.project.findFirst({
      where: {
        userId,
        OR: [
          { id: id },
          { slug: id }
        ]
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idOrSlug } = await params;
    const body = await req.json();

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    // Resolve slug to real ID if needed
    let realId = idOrSlug;
    if (idOrSlug.length !== 24) { // Basic ObjectId check
      const p = await prisma.project.findFirst({ where: { slug: idOrSlug, userId } });
      if (p) {
        realId = p.id;
      } else {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
    } else {
      const p = await prisma.project.findFirst({ where: { id: idOrSlug, userId } });
      if (!p) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
    }

    const {
      title, description, type, status, techStack,
      startDate, targetDate, completedDate,
      progress, hoursSpent, earnings, clientName,
      repositoryUrl, demoUrl, notes, tasks
    } = body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (type !== undefined) data.type = type;
    if (status !== undefined) data.status = status;
    if (techStack !== undefined) data.techStack = techStack;
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (targetDate !== undefined) data.targetDate = targetDate ? new Date(targetDate) : null;
    if (completedDate !== undefined) data.completedDate = completedDate ? new Date(completedDate) : null;
    if (progress !== undefined) data.progress = progress;
    if (hoursSpent !== undefined) data.hoursSpent = hoursSpent;
    if (earnings !== undefined) data.earnings = earnings;
    if (clientName !== undefined) data.clientName = clientName;
    if (repositoryUrl !== undefined) data.repositoryUrl = repositoryUrl;
    if (demoUrl !== undefined) data.demoUrl = demoUrl;
    if (notes !== undefined) data.notes = notes;
    if (tasks !== undefined) data.tasks = tasks;

    const project = await prisma.project.update({
      where: { id: realId },
      data,
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error(`Failed to update project:`, error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idOrSlug } = await params;
    
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    let realId = idOrSlug;
    if (idOrSlug.length !== 24) {
      const p = await prisma.project.findFirst({ where: { slug: idOrSlug, userId } });
      if (p) {
        realId = p.id;
      } else {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
    } else {
      const p = await prisma.project.findFirst({ where: { id: idOrSlug, userId } });
      if (!p) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
    }

    await prisma.project.delete({
      where: { id: realId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to delete project:`, error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
