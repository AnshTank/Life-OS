import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const partner = await prisma.partner.findUnique({
      where: { id },
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
    const body = await req.json();
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
    return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
