import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/notes
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const folder = searchParams.get('folder');

    const where: any = { userId };

    if (projectId && projectId !== 'none' && projectId !== 'null') {
      where.projectId = projectId;
    }
    if (folder && folder !== 'All') {
      where.folder = folder;
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST /api/notes
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const { title, content, originalContent, refinedContent, canvasData, folder, projectId, tags, backlinks, isFav, section } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        userId,
        title: title.trim(),
        content: content || '',
        originalContent: originalContent || null,
        refinedContent: refinedContent || null,
        canvasData: canvasData || null,
        folder: folder || 'All',
        section: section || null,
        projectId: (projectId && projectId !== 'none') ? projectId : null,
        tags: tags || [],
        backlinks: backlinks || [],
        isFav: !!isFav,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Failed to create note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

// PATCH /api/notes
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const { folderFrom, folderTo, projectId } = body;

    if (!folderFrom) {
      return NextResponse.json({ error: 'folderFrom is required' }, { status: 400 });
    }

    const where: any = { userId, folder: folderFrom };
    if (projectId && projectId !== 'none' && projectId !== 'null') {
      where.projectId = projectId;
    }

    const result = await prisma.note.updateMany({
      where,
      data: {
        folder: folderTo || 'Trash',
      },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Failed to bulk update notes:', error);
    return NextResponse.json({ error: 'Failed to bulk update notes' }, { status: 500 });
  }
}
