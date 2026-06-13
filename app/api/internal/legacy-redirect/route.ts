import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { articles, categories, redirects } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function categoryBlogSlugFromPath(path: string): string | null {
  const match = path.match(/^\/(?:en\/)?category-blog-layout-02\/([^/]+)\/?$/)
  if (!match?.[1]) return null

  try {
    const slug = decodeURIComponent(match[1]).trim()
    return slug.length > 0 && slug.length <= 240 ? slug : null
  } catch {
    return null
  }
}

function redirectResponse(destination: string, statusCode: number | null | undefined) {
  return NextResponse.json({
    redirect: {
      destination,
      status: statusCode === 308 ? 308 : 301,
    },
  }, {
    headers: {
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

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
      const categoryBlogSlug = categoryBlogSlugFromPath(path)
      if (!categoryBlogSlug) {
        return NextResponse.json({ redirect: null })
      }

      const [articleMatch] = await db
        .select({
          articleSlug:  articles.slug,
          categorySlug: categories.slug,
        })
        .from(articles)
        .innerJoin(categories, eq(articles.categoryId, categories.id))
        .where(and(eq(articles.slug, categoryBlogSlug), eq(articles.status, 'published')))
        .limit(1)

      if (!articleMatch) {
        return NextResponse.json({ redirect: null })
      }

      return redirectResponse(`/${articleMatch.categorySlug}/${articleMatch.articleSlug}`, 301)
    }

    return redirectResponse(match.toPath, Number(match.statusCode ?? 301))
  } catch (err) {
    console.warn('[legacy-redirect] lookup failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ redirect: null }, { status: 200 })
  }
}
