import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

function computePriorityScore(impact: number, urgency: number, effort: number): number {
  return Math.round((impact * 0.4 + urgency * 0.4 + (10 - effort) * 0.2) * 10) / 10;
}

// PATCH /api/tasks/[id] — update single task
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const body = await req.json();

    // Check task exists and is not deleted
    const existing = await prisma.task.findFirst({
      where: { id, userId, OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Recalculate priority score if impact/urgency/effort changed
    const impact = body.impact ?? existing.impact;
    const urgency = body.urgency ?? existing.urgency;
    const effort = body.effort ?? existing.effort;
    const priorityScore = computePriorityScore(impact, urgency, effort);

    // Build update data
    const updateData: Record<string, unknown> = {
      ...body,
      priorityScore,
    };

    // Handle date fields
    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }
    if (body.scheduledFor !== undefined) {
      updateData.scheduledFor = body.scheduledFor ? new Date(body.scheduledFor) : null;
    }
    if (body.reminderAt !== undefined) {
      updateData.reminderAt = body.reminderAt ? new Date(body.reminderAt) : null;
    }

    // If completing, set completedAt
    if (body.status === 'completed' && existing.status !== 'completed') {
      updateData.completedAt = new Date();
    }
    // If un-completing, clear completedAt
    if (body.status && body.status !== 'completed' && existing.status === 'completed') {
      updateData.completedAt = null;
    }

    // Clean fields that shouldn't be directly set
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.deletedAt;
    delete updateData.userId;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] — soft-delete single task
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const existing = await prisma.task.findFirst({
      where: { id, userId, OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
