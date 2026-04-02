export const dynamic = 'force-dynamic'

import { MetadataRoute } from 'next'
import { getLatestArticles, getAllCategories } from '@/lib/db/queries'
import { SITE_URL } from '@/lib/constants'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories] = await Promise.all([
    getLatestArticles(1000),
    getAllCategories(),
  ])

  const articleUrls: MetadataRoute.Sitemap = articles.map(a => ({
    url:             `${SITE_URL}/${a.category.slug}/${a.slug}`,
    lastModified:    a.updatedAt ? new Date(a.updatedAt) : new Date(a.publishedAt!),
    changeFrequency: 'weekly',
    priority:        0.7,
  }))

  const categoryUrls: MetadataRoute.Sitemap = categories.map(c => ({
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
