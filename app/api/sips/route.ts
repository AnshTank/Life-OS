import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const items = await prisma.sIP.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET SIPs error:', error);
    return NextResponse.json({ error: 'Failed to fetch SIPs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const body = await req.json();
    const item = await prisma.sIP.create({
      data: {
        userId,
        name: body.name,
        amount: parseFloat(body.amount),
        frequency: body.frequency || 'monthly',
        startDate: new Date(body.startDate),
        expectedReturn: parseFloat(body.expectedReturn),
        tenureYears: parseInt(body.tenureYears),
        totalInvested: parseFloat(body.totalInvested || 0),
        projectedValue: parseFloat(body.projectedValue),
        status: body.status || 'active',
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('POST SIPs error:', error);
    return NextResponse.json({ error: 'Failed to create SIP' }, { status: 500 });
  }
}
