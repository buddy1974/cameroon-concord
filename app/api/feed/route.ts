import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { articles, categories } from '@/lib/db/schema'
import { eq, and, inArray, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const topicsParam = req.nextUrl.searchParams.get('topics') || ''
  const slugs = topicsParam.split(',').filter(Boolean).slice(0, 10)
  if (slugs.length === 0) return NextResponse.json([])

  const catRows = await db
    .select({ id: categories.id })
    .from(categories)
    .where(inArray(categories.slug, slugs))

  if (catRows.length === 0) return NextResponse.json([])

  const catIds = catRows.map(c => c.id)

  const results = await db
    .select({
      id:            articles.id,
      title:         articles.title,
      slug:          articles.slug,
      excerpt:       articles.excerpt,
      featuredImage: articles.featuredImage,
      publishedAt:   articles.publishedAt,
      category:      { name: categories.name, slug: categories.slug },
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .where(and(eq(articles.status, 'published'), inArray(articles.categoryId, catIds)))
    .orderBy(desc(articles.publishedAt))
    .limit(24)

  return NextResponse.json(results)
}
