import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { comments, commentBans } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function moderateComment(body: string, authorName: string): Promise<{ flagged: boolean; reason: string }> {
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Moderate this comment. Reply with JSON only: {"flagged": true/false, "reason": "brief reason or null"}
Comment by "${authorName}": ${body}`
      }]
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{"flagged":false,"reason":null}';
    return JSON.parse(text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim());
  } catch {
    return { flagged: false, reason: '' };
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
  const body = await req.json();
  const { articleId, parentId, authorName, authorEmail, text, notifyEmail } = body;

  if (!articleId || !authorName || !authorEmail || !text) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const bans = await db.select().from(commentBans).where(eq(commentBans.value, ip));
  const emailBan = await db.select().from(commentBans).where(eq(commentBans.value, authorEmail.toLowerCase()));
  if (bans.length > 0 || emailBan.length > 0) {
    return NextResponse.json({ error: 'Submission not allowed' }, { status: 403 });
  }

  const mod = await moderateComment(text, authorName);
  const status = mod.flagged ? 'pending' : 'approved';

  await db.insert(comments).values({
    articleId,
    parentId: parentId || null,
    authorName,
    authorEmail,
    body: text,
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
