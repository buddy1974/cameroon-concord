import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const host = req.headers.get('host') || ''
  const url  = req.nextUrl

  if (
    !host.startsWith('www.') &&
    host.includes('cameroon-concord.com') &&
    !host.includes('vercel.app')
  ) {
    return NextResponse.redirect(
      `https://www.${host}${url.pathname}${url.search}`,
      { status: 301 }
    )
  }

  const { pathname } = req.nextUrl

  // Allow everything under these paths through immediately
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/fonts/') ||
    pathname === '/maintenance' ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|mp4|pdf)$/) !== null
  ) {
    return NextResponse.next()
  }

  // Old Joomla /en/ redirect
  if (pathname.startsWith('/en/')) {
    return NextResponse.redirect(
      new URL(pathname.replace(/^\/en/, ''), req.url),
      { status: 301 }
    )
  }

  // Maintenance mode — public pages only
  if (process.env.MAINTENANCE_MODE === 'true') {
    const bypass = req.cookies.get('maintenance_bypass')?.value
    if (bypass !== process.env.MAINTENANCE_PASSWORD) {
      return NextResponse.redirect(new URL('/maintenance', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
