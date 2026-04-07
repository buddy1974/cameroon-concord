import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { comments } from '@/lib/db/schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || !verifyToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
