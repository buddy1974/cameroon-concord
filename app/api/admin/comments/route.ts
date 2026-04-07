import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { comments, articles } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || !verifyToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'pending';

  let whereClause;
  if (status === 'flagged') {
    whereClause = eq(comments.flagged, 1);
  } else {
    whereClause = eq(comments.status, status as any);
  }

  const rows = await db.select({
    id: comments.id,
    articleId: comments.articleId,
    parentId: comments.parentId,
    authorName: comments.authorName,
    authorEmail: comments.authorEmail,
    body: comments.body,
    status: comments.status,
    flagged: comments.flagged,
    flagReason: comments.flagReason,
    ipAddress: comments.ipAddress,
    createdAt: comments.createdAt,
  })
  .from(comments)
  .where(whereClause)
  .orderBy(desc(comments.createdAt))
  .limit(100);

  return NextResponse.json(rows);
}
