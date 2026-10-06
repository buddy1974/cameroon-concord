import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { comments } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { articleId, parentId, text } = await req.json();
  if (!articleId || !text) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  await db.insert(comments).values({
    articleId,
    parentId: parentId || null,
    authorName: 'Cameroon Concord',
    authorEmail: 'editor@cameroon-concord.com',
    body: text,
    status: 'approved',
    authorIsAdmin: 1,
    flagged: 0,
  });

  return NextResponse.json({ ok: true });
}
