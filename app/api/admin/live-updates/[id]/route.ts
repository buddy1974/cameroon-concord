import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { liveUpdates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/auth/require-admin'

export const dynamic = 'force-dynamic'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const { id } = await params
  await db.delete(liveUpdates).where(eq(liveUpdates.id, parseInt(id)))
  return NextResponse.json({ ok: true })
}
