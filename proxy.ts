import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

const MAINTENANCE_PASSWORD = process.env.MAINTENANCE_PASSWORD || 'concord2026'
const MAINTENANCE_MODE     = process.env.MAINTENANCE_MODE === 'true'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow: API routes, static assets, maintenance pages, legacy image paths
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/media/') ||
    pathname === '/maintenance' ||
    pathname === '/maintenance-login' ||
    /\.(jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|otf|css|js)$/i.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Admin protection
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('admin_token')?.value
    if (!token) return NextResponse.redirect(new URL('/admin/login', req.url))
    const payload = await verifyToken(token)
    if (!payload) return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  // Old Joomla URL redirect
  if (pathname.startsWith('/en/')) {
    const newPath = pathname.replace(/^\/en/, '')
    return NextResponse.redirect(new URL(newPath, req.url), { status: 301 })
  }

  // Maintenance mode
  if (MAINTENANCE_MODE) {
    const bypass = req.cookies.get('maintenance_bypass')?.value
    if (bypass !== MAINTENANCE_PASSWORD) {
      return NextResponse.redirect(new URL('/maintenance', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
