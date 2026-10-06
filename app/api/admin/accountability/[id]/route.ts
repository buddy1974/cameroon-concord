import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { accountabilityPromises } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/auth/require-admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const { id } = await params
  const { status } = await req.json() as { status: string }
  const valid = ['pending', 'kept', 'broken', 'partial']
  if (!valid.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  await db
    .update(accountabilityPromises)
    .set({ status: status as 'pending' | 'kept' | 'broken' | 'partial', updatedAt: new Date() })
    .where(eq(accountabilityPromises.id, parseInt(id)))
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const { id } = await params
  await db.delete(accountabilityPromises).where(eq(accountabilityPromises.id, parseInt(id)))
  return NextResponse.json({ ok: true })
}
