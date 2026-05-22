import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Try finding by ID first, then by Slug
    const project = await prisma.project.findFirst({
      where: {
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

    // Resolve slug to real ID if needed
    let realId = idOrSlug;
    if (idOrSlug.length !== 24) { // Basic ObjectId check
      const p = await prisma.project.findUnique({ where: { slug: idOrSlug } });
      if (p) realId = p.id;
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
    
    let realId = idOrSlug;
    if (idOrSlug.length !== 24) {
      const p = await prisma.project.findUnique({ where: { slug: idOrSlug } });
      if (p) realId = p.id;
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
