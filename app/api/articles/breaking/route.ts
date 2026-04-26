import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { articles, categories } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await db
      .select({
        title:        articles.title,
        slug:         articles.slug,
        categorySlug: categories.slug,
      })
      .from(articles)
      .innerJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(eq(articles.isBreaking, true), eq(articles.status, 'published')))
      .orderBy(desc(articles.publishedAt))
      .limit(8)
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json([])
  }
}
