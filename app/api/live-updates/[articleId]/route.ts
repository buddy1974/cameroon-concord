import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { liveUpdates } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  const { articleId } = await params
  const updates = await db
    .select()
    .from(liveUpdates)
    .where(eq(liveUpdates.articleId, parseInt(articleId)))
    .orderBy(desc(liveUpdates.createdAt))
    .limit(50)
  return NextResponse.json(updates)
}
