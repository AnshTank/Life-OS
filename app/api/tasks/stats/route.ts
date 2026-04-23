import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tasks/stats — aggregated task statistics
export async function GET() {
  try {
    // MongoDB needs OR for null: field is null OR field is not set
    const where = { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] } as Record<string, unknown>;

    const [total, completed, inProgress, todo] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.count({ where: { ...where, status: 'completed' } }),
      prisma.task.count({ where: { ...where, status: 'in-progress' } }),
      prisma.task.count({ where: { ...where, status: 'todo' } }),
    ]);

    // Overdue: has dueDate in past, not completed
    const overdue = await prisma.task.count({
      where: {
        ...where,
        status: { not: 'completed' },
        dueDate: { lt: new Date() },
      },
    });

    return NextResponse.json({
      total,
      completed,
      inProgress,
      todo,
      overdue,
    });
  } catch (error) {
    console.error('Failed to fetch task stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
