import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { articles, categories } from '@/lib/db/schema'
import { eq, and, gt, like, desc } from 'drizzle-orm'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const articleId = parseInt(id)

  const [current] = await db
    .select({ title: articles.title, publishedAt: articles.publishedAt, categoryId: articles.categoryId })
    .from(articles).where(eq(articles.id, articleId)).limit(1)

  if (!current || !current.publishedAt) return NextResponse.json([])

  const keywords = current.title
    .replace(/[^a-zA-Z\s]/g, '')
    .split(' ')
    .filter(w => w.length > 4)
    .slice(0, 3)

  if (keywords.length === 0) return NextResponse.json([])

  const keyword = keywords[0]
  const results = await db
    .select({
      id:            articles.id,
      title:         articles.title,
      slug:          articles.slug,
      publishedAt:   articles.publishedAt,
      featuredImage: articles.featuredImage,
      category: { name: categories.name, slug: categories.slug },
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .where(
      and(
        eq(articles.status,     'published'),
        eq(articles.categoryId, current.categoryId),
        gt(articles.publishedAt, current.publishedAt),
        like(articles.title, `%${keyword}%`)
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(3)

  return NextResponse.json(results)
}
