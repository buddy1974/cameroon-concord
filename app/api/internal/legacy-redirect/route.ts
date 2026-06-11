import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { redirects } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path') || ''
  if (!path.startsWith('/') || path.includes('?')) {
    return NextResponse.json({ redirect: null })
  }

  try {
    const [match] = await db
      .select({
        toPath:     redirects.toPath,
        statusCode: redirects.statusCode,
      })
      .from(redirects)
      .where(eq(redirects.fromPath, path))
      .limit(1)

    if (!match?.toPath || !(match.toPath.startsWith('/') || match.toPath.startsWith('http'))) {
      return NextResponse.json({ redirect: null })
    }

    const status = Number(match.statusCode ?? 301)
    return NextResponse.json({
      redirect: {
        destination: match.toPath,
        status:      status === 308 ? 308 : 301,
      },
    }, {
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    console.warn('[legacy-redirect] lookup failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ redirect: null }, { status: 200 })
  }
}
