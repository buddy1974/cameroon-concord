import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { liveUpdates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.delete(liveUpdates).where(eq(liveUpdates.id, parseInt(id)))
  return NextResponse.json({ ok: true })
}
