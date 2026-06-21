import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// PATCH /api/mistakes/[mistakeId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ mistakeId: string }> }
) {
  try {
    const { mistakeId } = await params;
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const existing = await prisma.mistake.findFirst({
      where: { id: mistakeId, userId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Mistake not found or unauthorized' }, { status: 404 });
    }

    const body = await req.json();

    const updated = await prisma.mistake.update({
      where: { id: mistakeId },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update mistake:', error);
    return NextResponse.json({ error: 'Failed to update mistake' }, { status: 500 });
  }
}

// DELETE /api/mistakes/[mistakeId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ mistakeId: string }> }
) {
  try {
    const { mistakeId } = await params;
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const existing = await prisma.mistake.findFirst({
      where: { id: mistakeId, userId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Mistake not found or unauthorized' }, { status: 404 });
    }

    await prisma.mistake.delete({
      where: { id: mistakeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete mistake:', error);
    return NextResponse.json({ error: 'Failed to delete mistake' }, { status: 500 });
  }
}
