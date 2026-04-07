import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { comments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || !verifyToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
