export const revalidate = 3600

import { MetadataRoute } from 'next'
import { db } from '@/lib/db/client'
import { articles, categories } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getAllCategories } from '@/lib/db/queries'
import { SITE_URL } from '@/lib/constants'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let rows: { slug: string; updatedAt: Date | null; publishedAt: Date | null; catSlug: string }[] = []
  let cats: Awaited<ReturnType<typeof getAllCategories>> = []

  try {
    ;[rows, cats] = await Promise.all([
      db
        .select({
          slug:        articles.slug,
          updatedAt:   articles.updatedAt,
          publishedAt: articles.publishedAt,
          catSlug:     categories.slug,
        })
        .from(articles)
        .innerJoin(categories, eq(articles.categoryId, categories.id))
        .where(eq(articles.status, 'published'))
        .orderBy(desc(articles.publishedAt))
        .limit(1000),
      getAllCategories(),
    ])
  } catch { /* DB unavailable at build time */ }

  const articleUrls: MetadataRoute.Sitemap = rows.map(r => ({
    url:             `${SITE_URL}/${r.catSlug}/${r.slug}`,
    lastModified:    r.updatedAt ? new Date(r.updatedAt) : new Date(r.publishedAt!),
    changeFrequency: 'weekly',
    priority:        0.7,
  }))

  const categoryUrls: MetadataRoute.Sitemap = cats.map(c => ({
    url:             `${SITE_URL}/${c.slug}`,
    lastModified:    new Date(),
    changeFrequency: 'hourly',
    priority:        0.8,
  }))

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'always', priority: 1 },
    ...categoryUrls,
    ...articleUrls,
  ]
}
