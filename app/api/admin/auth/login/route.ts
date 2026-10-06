import { NextRequest, NextResponse } from 'next/server'
import { signToken } from '@/lib/auth'
import { safeEqual } from '@/lib/auth/safe-compare'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(() => ({})) as { username?: string; password?: string }

  // No fallback password: login is disabled until ADMIN_PASSWORD and JWT_SECRET are configured.
  const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin'
  const ADMIN_PASS = process.env.ADMIN_PASSWORD
  if (!ADMIN_PASS || !process.env.JWT_SECRET) {
    console.error('[auth] ADMIN_PASSWORD or JWT_SECRET is not configured — admin login disabled')
    return NextResponse.json({ error: 'Admin login is not configured' }, { status: 503 })
  }

  const userOk = safeEqual(username, ADMIN_USER)
  const passOk = safeEqual(password, ADMIN_PASS)
  if (!userOk || !passOk) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await signToken({ sub: ADMIN_USER, email: ADMIN_USER, role: 'admin' })
  const res   = NextResponse.json({ ok: true })
  res.cookies.set('admin_token', token, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7,
    path:     '/',
  })
  return res
}
