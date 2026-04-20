import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { articleReactions } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const articleId = parseInt(id)
  const rows = await db
    .select({ reaction: articleReactions.reaction, count: sql<number>`count(*)` })
    .from(articleReactions)
    .where(eq(articleReactions.articleId, articleId))
    .groupBy(articleReactions.reaction)
  return NextResponse.json(rows)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const articleId = parseInt(id)
  const { reaction } = await req.json() as { reaction: string }
  const valid = ['🔥', '😡', '😢', '👏', '🤔', '😮']
  if (!valid.includes(reaction)) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  await db.insert(articleReactions).values({ articleId, reaction })
  return NextResponse.json({ ok: true })
}
