import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { accountabilityPromises } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    official: string; ministry?: string; promise: string
    dateMade: string; deadline?: string; evidenceUrl?: string; notes?: string
  }
  if (!body.official?.trim() || !body.promise?.trim() || !body.dateMade) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const [row] = await db.insert(accountabilityPromises).values({
    official:    body.official,
    ministry:    body.ministry || null,
    promise:     body.promise,
    dateMade:    new Date(body.dateMade),
    deadline:    body.deadline ? new Date(body.deadline) : null,
    evidenceUrl: body.evidenceUrl || null,
    notes:       body.notes || null,
  }).$returningId()
  return NextResponse.json({ ok: true, id: row.id })
}
