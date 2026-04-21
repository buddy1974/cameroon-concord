import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { articleHits, articleReactions } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const articleId = parseInt(id)

  const [hits] = await db
    .select({ count: sql<number>`count(*)` })
    .from(articleHits)
    .where(eq(articleHits.articleId, articleId))

  const [reactions] = await db
    .select({ count: sql<number>`count(*)` })
    .from(articleReactions)
    .where(eq(articleReactions.articleId, articleId))

  const totalHits      = Number(hits?.count || 0)
  const totalReactions = Number(reactions?.count || 0)

  const raw   = (totalHits * 0.7) + (totalReactions * 0.3)
  const score = Math.min(10, Math.round((raw / 50) * 10 * 10) / 10)

  return NextResponse.json({ score, hits: totalHits, reactions: totalReactions })
}
