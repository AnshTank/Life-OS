import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/habits/[id] — update single habit
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.habit.findFirst({
      where: { id, OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const updateData = { ...body };

    // Clean protected fields
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.deletedAt;
    delete updateData.userId;
    delete updateData.streak;
    delete updateData.longestStreak; // Streak updates happen via checkins

    const habit = await prisma.habit.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(habit);
  } catch (error) {
    console.error('Failed to update habit:', error);
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 });
  }
}

// DELETE /api/habits/[id] — soft-delete single habit
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.habit.findFirst({
      where: { id, OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    await prisma.habit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete habit:', error);
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 });
  }
}
