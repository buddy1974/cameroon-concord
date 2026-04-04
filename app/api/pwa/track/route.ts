import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { sql } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const { event } = await req.json() as { event: string }
    if (!['click', 'installed', 'accepted'].includes(event)) {
      return NextResponse.json({ ok: false })
    }
    const ua = req.headers.get('user-agent') || ''
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || ''

    await db.execute(
      sql`INSERT INTO pwa_events (event, user_agent, ip) VALUES (${event}, ${ua}, ${ip})`
    )
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
