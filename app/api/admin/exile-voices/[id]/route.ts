import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { exileSubmissions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { status } = await req.json() as { status: string }
  const valid = ['pending', 'reviewing', 'published', 'rejected']
  if (!valid.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  await db
    .update(exileSubmissions)
    .set({ status: status as 'pending' | 'reviewing' | 'published' | 'rejected' })
    .where(eq(exileSubmissions.id, parseInt(id)))
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.delete(exileSubmissions).where(eq(exileSubmissions.id, parseInt(id)))
  return NextResponse.json({ ok: true })
}
