import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Admin protection
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('admin_token')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  // Redirect handler — check DB redirects table
  // For old Joomla URLs starting with /en/
  if (pathname.startsWith('/en/')) {
    // Strip /en prefix — most will resolve directly
    const newPath = pathname.replace(/^\/en/, '')
    return NextResponse.redirect(new URL(newPath, req.url), { status: 301 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/en/:path*',
  ],
}
