import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

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
      where: { id },
      data,
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error(`Failed to update project ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to delete project ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
