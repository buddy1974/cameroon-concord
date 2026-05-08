import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { comments, articles } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || !verifyToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'pending';
  const page   = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit  = 50;
  const offset = (page - 1) * limit;

  let whereClause;
  if (status === 'flagged') {
    whereClause = eq(comments.flagged, 1);
  } else {
    whereClause = eq(comments.status, status as any);
  }

  const rows = await db.select({
    id:           comments.id,
    articleId:    comments.articleId,
    articleTitle: articles.title,
    parentId:     comments.parentId,
    authorName:   comments.authorName,
    authorEmail:  comments.authorEmail,
    body:         comments.body,
    status:       comments.status,
    flagged:      comments.flagged,
    flagReason:   comments.flagReason,
    ipAddress:    comments.ipAddress,
    createdAt:    comments.createdAt,
  })
  .from(comments)
  .leftJoin(articles, eq(articles.id, comments.articleId))
  .where(whereClause)
  .orderBy(desc(comments.createdAt))
  .limit(limit)
  .offset(offset);

  // Total count for pagination
  const [{ total }] = await db.select({ total: sql<number>`count(*)` })
    .from(comments)
    .where(whereClause);

  return NextResponse.json({ rows, total, page, limit });
}
