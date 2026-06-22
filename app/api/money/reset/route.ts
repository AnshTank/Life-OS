import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    // Delete all user records from money collections in a single transaction
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { userId } }),
      prisma.investment.deleteMany({ where: { userId } }),
      prisma.budget.deleteMany({ where: { userId } }),
      prisma.eMI.deleteMany({ where: { userId } }),
      prisma.sIP.deleteMany({ where: { userId } }),
      prisma.savingsGoal.deleteMany({ where: { userId } }),
      prisma.subscription.deleteMany({ where: { userId } }),
      prisma.purchaseLog.deleteMany({ where: { userId } })
    ]);

    return NextResponse.json({ message: 'Financial data reset successfully' });
  } catch (error) {
    console.error('Reset financial data error:', error);
    return NextResponse.json({ error: 'Failed to reset financial data' }, { status: 500 });
  }
}
