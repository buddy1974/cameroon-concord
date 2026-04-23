import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { articles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token || !await verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await db.update(articles).set({ isBreaking: false }).where(eq(articles.isBreaking, true))
  return NextResponse.json({ ok: true })
}
