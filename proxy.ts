import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
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
    pathname === '/sitemap.xml' ||
    pathname === '/api/news-sitemap' ||
    pathname === '/robots.txt' ||
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

  // Legacy Joomla URL cleanup — return 410 Gone for old Joomla paths
  const joomlaPatterns = [
    '/index.php',
    '/component/',
    '/itemlist/',
    '/author/',
    '?format=feed',
    '?option=com_',
    '?start=',
    'Itemid=',
  ]

  const isJoomlaUrl = joomlaPatterns.some(p => req.nextUrl.pathname.includes(p) || req.nextUrl.search.includes(p))
  if (isJoomlaUrl) {
    return new NextResponse('Gone', { status: 410 })
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
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/maintenance',
    '/en/:path*',
    '/(.*index\\.php.*)',
    '/(.*component.*)',
    '/(.*itemlist.*)',
    '/(.*Itemid.*)',
  ],
}
