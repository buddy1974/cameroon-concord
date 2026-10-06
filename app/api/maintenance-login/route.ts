import { NextRequest, NextResponse } from 'next/server'
import { safeEqual } from '@/lib/auth/safe-compare'

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({})) as { password?: string }
  // No fallback password: bypass is impossible until MAINTENANCE_PASSWORD is configured.
  const correct = process.env.MAINTENANCE_PASSWORD
  if (!correct) {
    return NextResponse.json({ error: 'Maintenance bypass is not configured' }, { status: 503 })
  }

  if (!safeEqual(password, correct)) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('maintenance_bypass', correct, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
