import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Prisma } from '@prisma/client';

// Only these fields may be written through this endpoint. Before the whitelist,
// `data: body` meant a client could reassign a note's `userId` or `projectId` and
// hand it to another account.
const NOTE_WRITABLE_FIELDS = [
  'title',
  'content',
  'originalContent',
  'refinedContent',
  'canvasData',
  'folder',
  'section',
  'tags',
  'backlinks',
  'isFav',
] as const;

// PATCH /api/notes/[noteId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const existing = await prisma.note.findFirst({
      where: { id: noteId, userId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 });
    }

    const data: Record<string, any> = {};
    for (const field of NOTE_WRITABLE_FIELDS) {
      if (body[field] !== undefined) data[field] = body[field];
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No writable fields in request body' }, { status: 400 });
    }

    // Original-content guard. `content` holds the user's own writing and
    // `refinedContent` holds AI output; a write that makes them identical is the
    // signature of the bug that used to silently eat originals. Refuse it rather
    // than let a stale client destroy the only copy.
    const nextContent = data.content !== undefined ? data.content : existing.content;
    const nextRefined = data.refinedContent !== undefined ? data.refinedContent : existing.refinedContent;
    if (
      data.content !== undefined &&
      typeof nextContent === 'string' &&
      typeof nextRefined === 'string' &&
      nextRefined.trim() !== '' &&
      nextContent === nextRefined &&
      existing.content !== nextContent
    ) {
      return NextResponse.json(
        { error: 'Refused: this write would replace the note\'s original text with its refined text.' },
        { status: 409 }
      );
    }

    const updated = await prisma.note.update({
      where: { id: noteId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    // Surface validation problems instead of swallowing them into a 500 the UI
    // reports as a generic failure.
    if (
      error instanceof Prisma.PrismaClientValidationError ||
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code.startsWith('P20'))
    ) {
      console.error('Rejected note update:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to update note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

// DELETE /api/notes/[noteId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const existing = await prisma.note.findFirst({
      where: { id: noteId, userId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
