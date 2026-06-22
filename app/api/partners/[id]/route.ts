import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const partner = await prisma.partner.findFirst({
      where: { id, userId },
      include: {
        projects: { orderBy: { createdAt: 'desc' }, take: 20 },
        goals: { orderBy: { createdAt: 'desc' }, take: 20 },
        tasks: { orderBy: { createdAt: 'desc' }, take: 20 },
        notes: { orderBy: { createdAt: 'desc' } },
        _count: {
          select: { projects: true, goals: true, tasks: true, notes: true }
        }
      }
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    return NextResponse.json(partner);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch partner' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const existing = await prisma.partner.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const body = await req.json();

    // If email is changing, re-evaluate linkedUserId
    if (body.email !== undefined) {
      let linkedUserId: string | null = null;
      if (body.email && body.email.trim()) {
        const matchedUser = await prisma.user.findFirst({
          where: { email: { equals: body.email.trim(), mode: 'insensitive' } }
        });
        if (matchedUser) {
          linkedUserId = matchedUser.id;
        }
      }
      body.linkedUserId = linkedUserId;
    }

    const partner = await prisma.partner.update({
      where: { id },
      data: body,
      include: {
        _count: {
          select: { projects: true, goals: true, tasks: true, notes: true }
        }
      }
    });

    return NextResponse.json(partner);
  } catch (error) {
    console.error('Failed to update partner:', error);
    return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const existing = await prisma.partner.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }
    
    // Disconnect partner from related entities first
    await prisma.project.updateMany({
      where: { partnerId: id },
      data: { partnerId: null }
    });
    await prisma.goal.updateMany({
      where: { partnerId: id },
      data: { partnerId: null }
    });
    await prisma.task.updateMany({
      where: { partnerId: id },
      data: { partnerId: null, sharedWithPartner: false }
    });

    // Delete partner (cascade deletes PartnerNote)
    await prisma.partner.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete partner' }, { status: 500 });
  }
}
