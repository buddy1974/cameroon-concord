import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { db } from '@/lib/db/client'
import { pushSubscriptions } from '@/lib/db/schema'
import { requireAutomation } from '@/lib/auth/require-automation'

export async function POST(req: NextRequest) {
  // Authenticate before doing any work.
  const automation = requireAutomation(req)
  if (!automation.ok) return automation.response
  webpush.setVapidDetails(
    'mailto:editor@cameroon-concord.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  const { title, body, url } = await req.json() as { title: string; body: string; url: string }
  const subs = await db.select().from(pushSubscriptions).limit(1000)
  const payload = JSON.stringify({ title, body, url })
  let sent = 0, failed = 0
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch {
        failed++
      }
    })
  )
  return NextResponse.json({ sent, failed })
}
