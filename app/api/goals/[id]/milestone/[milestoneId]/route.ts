import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string, milestoneId: string }> }
) {
  try {
    const { id: goalId, milestoneId } = await params;
    
    // Toggle the completed status or apply specific status if provided
    const data = await req.json().catch(() => ({}));
    
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId }
    });

    if (!milestone || milestone.goalId !== goalId) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const newCompletedStatus = data.completed !== undefined ? data.completed : !milestone.completed;
    const completedAt = newCompletedStatus && !milestone.completed ? new Date() : milestone.completedAt;

    // Update the milestone
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        completed: newCompletedStatus,
        completedAt: newCompletedStatus ? completedAt : null
      }
    });

    // Fetch all milestones to recalculate progress
    const allMilestones = await prisma.milestone.findMany({
      where: { goalId }
    });

    const completedCount = allMilestones.filter(m => m.completed).length;
    const totalCount = allMilestones.length;
    const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    // Update goal progress and potentially status
    let statusUpdate = undefined;
    if (progress === 100) {
      statusUpdate = 'completed';
    } else {
      statusUpdate = 'active';
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        progress,
        ...(statusUpdate ? { status: statusUpdate } : {})
      },
      include: { milestones: { orderBy: { createdAt: 'asc' } } }
    });

    return NextResponse.json(updatedGoal);
  } catch (error: any) {
    console.error('Failed to toggle milestone:', error);
    return NextResponse.json({ error: error.message || 'Failed to toggle milestone' }, { status: 500 });
  }
}
