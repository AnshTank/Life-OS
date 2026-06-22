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

    const existing = await prisma.eMI.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.principal !== undefined) data.principal = parseFloat(body.principal);
    if (body.interestRate !== undefined) data.interestRate = parseFloat(body.interestRate);
    if (body.tenureMonths !== undefined) data.tenureMonths = parseInt(body.tenureMonths);
    if (body.emiAmount !== undefined) data.emiAmount = parseFloat(body.emiAmount);
    if (body.startDate !== undefined) data.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) data.endDate = new Date(body.endDate);
    if (body.totalInterest !== undefined) data.totalInterest = parseFloat(body.totalInterest);
    if (body.totalAmount !== undefined) data.totalAmount = parseFloat(body.totalAmount);
    if (body.paidMonths !== undefined) data.paidMonths = parseInt(body.paidMonths);
    if (body.remainingMonths !== undefined) data.remainingMonths = parseInt(body.remainingMonths);
    if (body.status !== undefined) data.status = body.status;

    const updated = await prisma.eMI.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH EMI error:', error);
    return NextResponse.json({ error: 'Failed to update EMI' }, { status: 500 });
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

    const existing = await prisma.eMI.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.eMI.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE EMI error:', error);
    return NextResponse.json({ error: 'Failed to delete EMI' }, { status: 500 });
  }
}
