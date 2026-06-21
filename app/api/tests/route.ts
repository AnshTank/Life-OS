import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/tests
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    const where: any = { userId };

    if (projectId && projectId !== 'none' && projectId !== 'null') {
      where.projectId = projectId;
    }

    const testCases = await prisma.testCase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(testCases);
  } catch (error) {
    console.error('Failed to fetch test cases:', error);
    return NextResponse.json({ error: 'Failed to fetch test cases' }, { status: 500 });
  }
}

// POST /api/tests
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    
    // Support either single test case or bulk list creation
    if (Array.isArray(body)) {
      const createdCases = [];
      for (const item of body) {
        const { title, description, steps, expectedResult, status, testType, projectId, requirementId } = item;
        const testCase = await prisma.testCase.create({
          data: {
            userId,
            title: title || 'Untitled Test Case',
            description: description || '',
            steps: steps || [],
            expectedResult: expectedResult || '',
            status: status || 'pending',
            testType: testType || 'functional',
            projectId: (projectId && projectId !== 'none') ? projectId : null,
            requirementId: (requirementId && requirementId !== 'none') ? requirementId : null,
          }
        });
        createdCases.push(testCase);
      }
      return NextResponse.json(createdCases, { status: 201 });
    } else {
      const { title, description, steps, expectedResult, status, testType, projectId, requirementId } = body;

      if (!title || !title.trim()) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      }

      const testCase = await prisma.testCase.create({
        data: {
          userId,
          title: title.trim(),
          description: description || '',
          steps: steps || [],
          expectedResult: expectedResult || '',
          status: status || 'pending',
          testType: testType || 'functional',
          projectId: (projectId && projectId !== 'none') ? projectId : null,
          requirementId: (requirementId && requirementId !== 'none') ? requirementId : null,
        },
      });

      return NextResponse.json(testCase, { status: 201 });
    }
  } catch (error) {
    console.error('Failed to create test case:', error);
    return NextResponse.json({ error: 'Failed to create test case' }, { status: 500 });
  }
}
