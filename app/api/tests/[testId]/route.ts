import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// PATCH /api/tests/[testId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params;
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const existing = await prisma.testCase.findFirst({
      where: { id: testId, userId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Test case not found or unauthorized' }, { status: 404 });
    }

    const body = await req.json();

    const updated = await prisma.testCase.update({
      where: { id: testId },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update test case:', error);
    return NextResponse.json({ error: 'Failed to update test case' }, { status: 500 });
  }
}

// DELETE /api/tests/[testId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params;
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const existing = await prisma.testCase.findFirst({
      where: { id: testId, userId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Test case not found or unauthorized' }, { status: 404 });
    }

    await prisma.testCase.delete({
      where: { id: testId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete test case:', error);
    return NextResponse.json({ error: 'Failed to delete test case' }, { status: 500 });
  }
}
