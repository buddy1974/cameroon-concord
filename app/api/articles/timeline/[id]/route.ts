import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { articles, categories, articleTags } from '@/lib/db/schema'
import { eq, and, asc, ne, inArray } from 'drizzle-orm'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const articleId = parseInt(id)

  const tagRows = await db
    .select({ tagId: articleTags.tagId })
    .from(articleTags)
    .where(eq(articleTags.articleId, articleId))

  if (tagRows.length === 0) return NextResponse.json([])

  const tagIds = tagRows.map(r => r.tagId)

  const articleIdRows = await db
    .selectDistinct({ articleId: articleTags.articleId })
    .from(articleTags)
    .where(
      and(
        inArray(articleTags.tagId, tagIds),
        ne(articleTags.articleId, articleId)
      )
    )
    .limit(20)

  if (articleIdRows.length === 0) return NextResponse.json([])

  const ids = articleIdRows.map(r => r.articleId)

  const results = await db
    .select({
      id:          articles.id,
      title:       articles.title,
      slug:        articles.slug,
      publishedAt: articles.publishedAt,
      category:    { name: categories.name, slug: categories.slug },
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .where(
      and(
        eq(articles.status, 'published'),
        inArray(articles.id, ids)
      )
    )
    .orderBy(asc(articles.publishedAt))
    .limit(15)

  return NextResponse.json(results)
}
