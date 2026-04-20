import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { pushSubscriptions } from '@/lib/db/schema'

export async function POST(req: NextRequest) {
  const sub = await req.json() as {
    endpoint?: string
    keys?: { p256dh?: string; auth?: string }
  }
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }
  try {
    await db.insert(pushSubscriptions).values({
      endpoint: sub.endpoint,
      p256dh:   sub.keys.p256dh,
      auth:     sub.keys.auth,
    }).onDuplicateKeyUpdate({ set: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
