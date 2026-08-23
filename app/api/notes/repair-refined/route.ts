import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

/**
 * POST /api/notes/repair-refined
 *
 * One-shot, idempotent repair for notes damaged by an older build of the Notes
 * Suite: selecting a note that had `refinedContent` copied the refined text over
 * `content`, so the user's original was replaced by the AI output with no user
 * action at all.
 *
 * Only the unambiguous damage signature is touched:
 *
 *   content === refinedContent      // `content` is holding the AI output
 *   && originalContent is non-empty // there is a real original to restore
 *   && originalContent !== content  // …and it differs, so this isn't a no-op
 *
 * Notes whose `content` matches `refinedContent` but that carry no
 * `originalContent` are counted as `unrecoverable` and left exactly as they are
 * — there is nothing to restore from and guessing would destroy the only copy
 * the user still has.
 *
 * Safe to call repeatedly: after a repair `content !== refinedContent`, so the
 * signature no longer matches.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    let projectId: string | null = null;
    try {
      const body = await req.json();
      if (typeof body?.projectId === 'string' && body.projectId !== 'none' && body.projectId !== 'null') {
        projectId = body.projectId;
      }
    } catch {
      // No body is fine — repair every note the user owns.
    }

    const where: any = { userId, NOT: { refinedContent: null } };
    if (projectId) where.projectId = projectId;

    const candidates = await prisma.note.findMany({
      where,
      select: { id: true, content: true, originalContent: true, refinedContent: true },
    });

    let repaired = 0;
    let unrecoverable = 0;

    for (const note of candidates) {
      const refined = note.refinedContent ?? '';
      const original = note.originalContent ?? '';

      // `content` is not holding the refined text — nothing to do.
      if (!refined || note.content !== refined) continue;

      if (!original || original === note.content) {
        unrecoverable++;
        continue;
      }

      await prisma.note.update({
        where: { id: note.id },
        data: { content: original },
      });
      repaired++;
    }

    return NextResponse.json({ repaired, unrecoverable, scanned: candidates.length });
  } catch (error) {
    console.error('Failed to repair refined notes:', error);
    return NextResponse.json({ error: 'Failed to repair refined notes' }, { status: 500 });
  }
}
