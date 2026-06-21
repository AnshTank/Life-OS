import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const data = await req.json();

    // Verify ownership and existence
    const existing = await prisma.goal.findFirst({
      where: {
        id,
        userId,
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Prepare update payload
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.lifeArea !== undefined) updateData.lifeArea = data.lifeArea;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.targetDate !== undefined) updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.impact !== undefined) updateData.impact = data.impact;
    if (data.sharedWithPartner !== undefined) updateData.sharedWithPartner = data.sharedWithPartner;
    
    // Direct progress update override (if not using milestones)
    if (data.progress !== undefined) updateData.progress = data.progress;

    if (data.milestones) {
      // In Prisma, to update a nested array, we can use deleteMany and create
      // or upsert. For simplicity, delete all and recreate
      await prisma.milestone.deleteMany({ where: { goalId: id } });
      updateData.milestones = {
        create: data.milestones.map((m: any) => ({
          title: m.title,
          completed: m.completed,
          completedAt: m.completedAt ? new Date(m.completedAt) : null,
        }))
      };
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: updateData,
      include: { milestones: true }
    });

    return NextResponse.json(goal);
  } catch (error: any) {
    console.error('Failed to update goal:', error);
    return NextResponse.json({ error: error.message || 'Failed to update goal' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const existing = await prisma.goal.findFirst({
      where: {
        id,
        userId,
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Soft delete
    await prisma.goal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete goal:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete goal' }, { status: 500 });
  }
}
