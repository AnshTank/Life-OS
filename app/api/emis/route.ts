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
    const items = await prisma.eMI.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET EMIs error:', error);
    return NextResponse.json({ error: 'Failed to fetch EMIs' }, { status: 500 });
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
    const item = await prisma.eMI.create({
      data: {
        userId,
        name: body.name,
        principal: parseFloat(body.principal),
        interestRate: parseFloat(body.interestRate),
        tenureMonths: parseInt(body.tenureMonths),
        emiAmount: parseFloat(body.emiAmount),
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        totalInterest: parseFloat(body.totalInterest),
        totalAmount: parseFloat(body.totalAmount),
        paidMonths: parseInt(body.paidMonths || 0),
        remainingMonths: parseInt(body.remainingMonths),
        status: body.status || 'active',
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('POST EMIs error:', error);
    return NextResponse.json({ error: 'Failed to create EMI' }, { status: 500 });
  }
}
