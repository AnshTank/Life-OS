import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/tasks/bulk — bulk operations
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ids } = body;

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'action and ids[] are required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'delete':
        // Soft-delete many
        result = await prisma.task.updateMany({
          where: { id: { in: ids }, OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
          data: { deletedAt: new Date() },
        });
        break;

      case 'complete':
        // Complete many
        result = await prisma.task.updateMany({
          where: { id: { in: ids }, OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }], status: { not: 'completed' } },
          data: { status: 'completed', completedAt: new Date() },
        });
        break;

      case 'updateStatus':
        // Change status of many
        const { status } = body;
        if (!status) {
          return NextResponse.json({ error: 'status is required for updateStatus action' }, { status: 400 });
        }
        const data: Record<string, unknown> = { status };
        if (status === 'completed') {
          data.completedAt = new Date();
        }
        result = await prisma.task.updateMany({
          where: { id: { in: ids }, OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
          data,
        });
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Failed to perform bulk operation:', error);
    return NextResponse.json({ error: 'Failed to perform bulk operation' }, { status: 500 });
  }
}
