import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db/client'
import { articles, categories, authors, articleHits } from '@/lib/db/schema'
import { eq, desc, and, or, like, sql, inArray } from 'drizzle-orm'
import type { ArticleWithRelations } from '@/lib/types'

function cleanImg(url: string | null | undefined): string | null {
  if (!url) return null
  const clean = url.split('#')[0].trim()
  if (!clean || !clean.startsWith('http')) return null
  return clean
}

async function _getArticleBySlug(
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
    featuredImage: cleanImg(rows[0].article.featuredImage),
    category: rows[0].category,
    author:   rows[0].author ?? null,
    tags:     [],
    hits:     rows[0].hits ?? 0,
  }
}

export const getArticleBySlug = unstable_cache(
  _getArticleBySlug,
  ['article-by-slug'],
  { revalidate: 3600, tags: ['articles'] }
)

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

async function _getLatestArticles(limit = 20, offset = 0): Promise<ArticleWithRelations[]> {
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

export const getLatestArticles = unstable_cache(
  _getLatestArticles,
  ['latest-articles'],
  { revalidate: 60, tags: ['articles'] }
)

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
        inArray(articles.categoryId, [6, 9, 10, 12]),
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(limit)

  if (rows.length < limit) {
    const needed = limit - rows.length
    const ids = new Set(rows.map(r => r.article.id))
    const extra = await db
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
          inArray(articles.categoryId, [6, 9, 10, 12]),
        )
      )
      .orderBy(desc(articles.publishedAt))
      .limit(needed + ids.size)
    return [
      ...rows.map(r => ({ ...r.article, featuredImage: cleanImg(r.article.featuredImage), category: r.category, author: r.author ?? null, tags: [], hits: r.hits ?? 0 })),
      ...extra
          .map(r => ({ ...r.article, featuredImage: cleanImg(r.article.featuredImage), category: r.category, author: r.author ?? null, tags: [], hits: r.hits ?? 0 }))
          .filter(a => !ids.has(a.id))
          .slice(0, needed),
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

async function _getMostRead(limit = 5): Promise<ArticleWithRelations[]> {
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

export const getMostRead = unstable_cache(
  _getMostRead,
  ['most-read'],
  { revalidate: 60, tags: ['articles'] }
)

async function _getRelatedArticles(
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

export const getRelatedArticles = unstable_cache(
  _getRelatedArticles,
  ['related-articles'],
  { revalidate: 3600, tags: ['articles'] }
)

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
        or(
          like(articles.title,   `%${query}%`),
          like(articles.excerpt, `%${query}%`),
          like(articles.body,    `%${query}%`),
        ),
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

export async function getArticleById(id: number) {
  const rows = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1)
  return rows[0] ?? null
}

export async function incrementHit(articleId: number): Promise<void> {
  await db
    .insert(articleHits)
    .values({ articleId, hits: 1 })
    .onDuplicateKeyUpdate({
      set: { hits: sql`hits + 1` },
    })
}
