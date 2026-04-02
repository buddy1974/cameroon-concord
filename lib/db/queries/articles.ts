import { db } from '@/lib/db/client'
import { articles, categories, authors, articleHits } from '@/lib/db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'
import type { ArticleWithRelations } from '@/lib/types'

function cleanImg(url: string | null | undefined): string | null {
  if (!url) return null
  return url.split('#')[0].trim() || null
}

export async function getArticleBySlug(
  categorySlug: string,
  articleSlug: string
): Promise<ArticleWithRelations | null> {
  const rows = await db
    .select({
      article:  articles,
      category: categories,
      author:   authors,
      hits:     articleHits.hits,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(authors,     eq(articles.authorId,   authors.id))
    .leftJoin(articleHits, eq(articleHits.articleId, articles.id))
    .where(
      and(
        eq(articles.slug,   articleSlug.toLowerCase().trim()),
        eq(articles.status, 'published'),
      )
    )
    .limit(1)

  if (!rows[0]) return null
  return {
    ...rows[0].article,
    category: rows[0].category,
    author:   rows[0].author ?? null,
    tags:     [],
    hits:     rows[0].hits ?? 0,
  }
}

export async function getArticlesByCategory(
  categorySlug: string,
  page = 1,
  limit = 20
): Promise<{ articles: ArticleWithRelations[], total: number }> {
  const offset = (page - 1) * limit

  const rows = await db
    .select({
      article:  articles,
      category: categories,
      author:   authors,
      hits:     articleHits.hits,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(authors,     eq(articles.authorId,   authors.id))
    .leftJoin(articleHits, eq(articleHits.articleId, articles.id))
    .where(
      and(
        eq(categories.slug, categorySlug.toLowerCase().trim()),
        eq(articles.status, 'published'),
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .offset(offset)

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .where(
      and(
        eq(categories.slug, categorySlug.toLowerCase().trim()),
        eq(articles.status, 'published'),
      )
    )

  return {
    articles: rows.map(r => ({
      ...r.article, featuredImage: cleanImg(r.article.featuredImage),
      category: r.category,
      author:   r.author ?? null,
      tags:     [],
      hits:     r.hits ?? 0,
    })),
    total: Number(count),
  }
}

export async function getLatestArticles(limit = 20, offset = 0): Promise<ArticleWithRelations[]> {
  const rows = await db
    .select({
      article:  articles,
      category: categories,
      author:   authors,
      hits:     articleHits.hits,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(authors,     eq(articles.authorId,   authors.id))
    .leftJoin(articleHits, eq(articleHits.articleId, articles.id))
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .offset(offset)

  return rows.map(r => ({
    ...r.article, featuredImage: cleanImg(r.article.featuredImage),
    category: r.category,
    author:   r.author ?? null,
    tags:     [],
    hits:     r.hits ?? 0,
  }))
}

export async function getFeaturedArticles(limit = 3): Promise<ArticleWithRelations[]> {
  const rows = await db
    .select({
      article:  articles,
      category: categories,
      author:   authors,
      hits:     articleHits.hits,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(authors,     eq(articles.authorId,   authors.id))
    .leftJoin(articleHits, eq(articleHits.articleId, articles.id))
    .where(
      and(
        eq(articles.status,     'published'),
        eq(articles.isFeatured, true),
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(limit)

  if (rows.length < limit) {
    const extra = await getLatestArticles(limit - rows.length)
    const ids = new Set(rows.map(r => r.article.id))
    return [
      ...rows.map(r => ({ ...r.article, featuredImage: cleanImg(r.article.featuredImage), category: r.category, author: r.author ?? null, tags: [], hits: r.hits ?? 0 })),
      ...extra.filter(a => !ids.has(a.id)),
    ]
  }

  return rows.map(r => ({
    ...r.article, featuredImage: cleanImg(r.article.featuredImage),
    category: r.category,
    author:   r.author ?? null,
    tags:     [],
    hits:     r.hits ?? 0,
  }))
}

export async function getBreakingNews(limit = 5): Promise<ArticleWithRelations[]> {
  const rows = await db
    .select({
      article:  articles,
      category: categories,
      author:   authors,
      hits:     articleHits.hits,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(authors,     eq(articles.authorId,   authors.id))
    .leftJoin(articleHits, eq(articleHits.articleId, articles.id))
    .where(
      and(
        eq(articles.status,     'published'),
        eq(articles.isBreaking, true),
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(limit)

  return rows.map(r => ({
    ...r.article, featuredImage: cleanImg(r.article.featuredImage),
    category: r.category,
    author:   r.author ?? null,
    tags:     [],
    hits:     r.hits ?? 0,
  }))
}

export async function getMostRead(limit = 5): Promise<ArticleWithRelations[]> {
  const rows = await db
    .select({
      article:  articles,
      category: categories,
      author:   authors,
      hits:     articleHits.hits,
    })
    .from(articles)
    .innerJoin(categories,  eq(articles.categoryId,   categories.id))
    .leftJoin(authors,      eq(articles.authorId,     authors.id))
    .innerJoin(articleHits, eq(articleHits.articleId, articles.id))
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articleHits.hits))
    .limit(limit)

  return rows.map(r => ({
    ...r.article, featuredImage: cleanImg(r.article.featuredImage),
    category: r.category,
    author:   r.author ?? null,
    tags:     [],
    hits:     r.hits ?? 0,
  }))
}

export async function getRelatedArticles(
  articleId: number,
  categoryId: number,
  limit = 4
): Promise<ArticleWithRelations[]> {
  const rows = await db
    .select({
      article:  articles,
      category: categories,
      author:   authors,
      hits:     articleHits.hits,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(authors,     eq(articles.authorId,   authors.id))
    .leftJoin(articleHits, eq(articleHits.articleId, articles.id))
    .where(
      and(
        eq(articles.categoryId, categoryId),
        eq(articles.status,     'published'),
        sql`${articles.id} != ${articleId}`,
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(limit)

  return rows.map(r => ({
    ...r.article, featuredImage: cleanImg(r.article.featuredImage),
    category: r.category,
    author:   r.author ?? null,
    tags:     [],
    hits:     r.hits ?? 0,
  }))
}

export async function searchArticles(
  query: string,
  limit = 20,
  offset = 0
): Promise<ArticleWithRelations[]> {
  const rows = await db
    .select({
      article:  articles,
      category: categories,
      author:   authors,
      hits:     articleHits.hits,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(authors,     eq(articles.authorId,   authors.id))
    .leftJoin(articleHits, eq(articleHits.articleId, articles.id))
    .where(
      and(
        eq(articles.status, 'published'),
        sql`MATCH(${articles.title}, ${articles.body}, ${articles.excerpt})
            AGAINST(${query} IN BOOLEAN MODE)`,
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .offset(offset)

  return rows.map(r => ({
    ...r.article, featuredImage: cleanImg(r.article.featuredImage),
    category: r.category,
    author:   r.author ?? null,
    tags:     [],
    hits:     r.hits ?? 0,
  }))
}

export async function incrementHit(articleId: number): Promise<void> {
  await db
    .insert(articleHits)
    .values({ articleId, hits: 1 })
    .onDuplicateKeyUpdate({
      set: { hits: sql`hits + 1` },
    })
}
