import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { articles, comments, commentBans } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { sanitizeCommentText } from '@/lib/sanitize';

async function moderateComment(body: string, authorName: string): Promise<{ flagged: boolean; reason: string }> {
  if (!process.env.OPENAI_API_KEY) {
    return { flagged: true, reason: 'Moderation unavailable' };
  }
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `Moderate this comment. Reply with JSON only: {"flagged": true/false, "reason": "brief reason or null"}
Comment by "${authorName}": ${body}`,
        }],
      }),
    });
    if (!response.ok) return { flagged: true, reason: 'Moderation unavailable' };
    const aiData = await response.json() as { choices?: { message?: { content?: string } }[] };
    const text = aiData.choices?.[0]?.message?.content || '{"flagged":false,"reason":null}';
    return JSON.parse(text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim());
  } catch {
    return { flagged: true, reason: 'Moderation unavailable' };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const articleId = parseInt(searchParams.get('articleId') || '0');
  if (!articleId) return NextResponse.json([]);

  const rows = await db.select({
    id: comments.id,
    parentId: comments.parentId,
    authorName: comments.authorName,
    authorIsAdmin: comments.authorIsAdmin,
    body: comments.body,
    createdAt: comments.createdAt,
  })
  .from(comments)
  .where(and(eq(comments.articleId, articleId), eq(comments.status, 'approved')))
  .orderBy(desc(comments.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '';
  const body = await req.json() as {
    articleId?: unknown;
    parentId?: unknown;
    authorName?: unknown;
    authorEmail?: unknown;
    text?: unknown;
    notifyEmail?: unknown;
  };
  const articleId = Number(body.articleId);
  const parentId = body.parentId ? Number(body.parentId) : null;
  const authorName = typeof body.authorName === 'string' ? body.authorName.trim() : '';
  const authorEmail = typeof body.authorEmail === 'string' ? body.authorEmail.trim().toLowerCase() : '';
  const text = typeof body.text === 'string' ? body.text : '';
  const notifyEmail = body.notifyEmail === true;

  if (!Number.isInteger(articleId) || articleId <= 0 || !authorName || !authorEmail || !text) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (parentId !== null && (!Number.isInteger(parentId) || parentId <= 0)) {
    return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const safeName = sanitizeCommentText(authorName).slice(0, 120)
  if (safeName.length < 2) {
    return NextResponse.json({ error: 'Name is too short' }, { status: 400 });
  }

  const [article] = await db.select({ id: articles.id })
    .from(articles)
    .where(and(eq(articles.id, articleId), eq(articles.status, 'published')))
    .limit(1);
  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  const bans = await db.select().from(commentBans).where(eq(commentBans.value, ip));
  const emailBan = await db.select().from(commentBans).where(eq(commentBans.value, authorEmail));
  if (bans.length > 0 || emailBan.length > 0) {
    return NextResponse.json({ error: 'Submission not allowed' }, { status: 403 });
  }

  const safeText = sanitizeCommentText(text)
  if (!safeText) return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 })

  const mod = await moderateComment(safeText, authorName);
  const status = mod.flagged ? 'pending' : 'approved';

  await db.insert(comments).values({
    articleId,
    parentId,
    authorName: safeName,
    authorEmail,
    body: safeText,
    status,
    ipAddress: ip,
    flagged: mod.flagged ? 1 : 0,
    flagReason: mod.reason || null,
    notifyEmail: notifyEmail ? 1 : 0,
  });

  return NextResponse.json({
    success: true,
    pending: mod.flagged,
    message: mod.flagged ? 'Your comment is awaiting moderation.' : 'Comment posted successfully.'
  });
}
