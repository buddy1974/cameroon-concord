import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { comments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const { action } = await req.json();

  if (action === 'approve') {
    await db.update(comments).set({ status: 'approved', flagged: 0 }).where(eq(comments.id, parseInt(id)));
  } else if (action === 'spam') {
    await db.update(comments).set({ status: 'spam' }).where(eq(comments.id, parseInt(id)));
  } else if (action === 'delete') {
    await db.delete(comments).where(eq(comments.id, parseInt(id)));
  }

  return NextResponse.json({ ok: true });
}
