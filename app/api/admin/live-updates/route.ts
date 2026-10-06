import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { liveUpdates } from '@/lib/db/schema'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/require-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const { articleId, content, label } = await req.json() as {
    articleId: number; content: string; label?: string
  }
  if (!articleId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const [row] = await db.insert(liveUpdates).values({ articleId, content, label: label || null }).$returningId()
  revalidatePath('/[category]/[slug]', 'page')
  return NextResponse.json({ ok: true, id: row.id })
}
