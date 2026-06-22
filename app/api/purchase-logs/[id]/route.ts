import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

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

    const existing = await prisma.purchaseLog.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.amount !== undefined) data.amount = parseFloat(body.amount);
    if (body.date !== undefined) data.date = new Date(body.date);
    if (body.category !== undefined) data.category = body.category;
    if (body.satisfactionRating !== undefined) data.satisfactionRating = parseInt(body.satisfactionRating);
    if (body.notes !== undefined) data.notes = body.notes;

    const updated = await prisma.purchaseLog.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH purchase-log error:', error);
    return NextResponse.json({ error: 'Failed to update purchase log' }, { status: 500 });
  }
}

export async function DELETE(
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

    const existing = await prisma.purchaseLog.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.purchaseLog.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE purchase-log error:', error);
    return NextResponse.json({ error: 'Failed to delete purchase log' }, { status: 500 });
  }
}
