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

    const existing = await prisma.sIP.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.amount !== undefined) data.amount = parseFloat(body.amount);
    if (body.frequency !== undefined) data.frequency = body.frequency;
    if (body.startDate !== undefined) data.startDate = new Date(body.startDate);
    if (body.expectedReturn !== undefined) data.expectedReturn = parseFloat(body.expectedReturn);
    if (body.tenureYears !== undefined) data.tenureYears = parseInt(body.tenureYears);
    if (body.totalInvested !== undefined) data.totalInvested = parseFloat(body.totalInvested);
    if (body.projectedValue !== undefined) data.projectedValue = parseFloat(body.projectedValue);
    if (body.status !== undefined) data.status = body.status;

    const updated = await prisma.sIP.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH SIP error:', error);
    return NextResponse.json({ error: 'Failed to update SIP' }, { status: 500 });
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

    const existing = await prisma.sIP.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.sIP.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE SIP error:', error);
    return NextResponse.json({ error: 'Failed to delete SIP' }, { status: 500 });
  }
}
