export const revalidate = 300

import { db } from '@/lib/db/client'
import { articles, categories } from '@/lib/db/schema'
import { eq, desc, gte, and } from 'drizzle-orm'
import { SITE_NAME, SITE_URL } from '@/lib/constants'

export async function GET() {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)

  let rows: { slug: string; title: string; publishedAt: Date | null; categorySlug: string }[] = []
  try {
    rows = await db
      .select({
        slug:         articles.slug,
        title:        articles.title,
        publishedAt:  articles.publishedAt,
        categorySlug: categories.slug,
      })
      .from(articles)
      .innerJoin(categories, eq(articles.categoryId, categories.id))
      .where(
        and(
          eq(articles.status, 'published'),
          gte(articles.publishedAt, twoDaysAgo),
        )
      )
      .orderBy(desc(articles.publishedAt))
      .limit(1000)
  } catch {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>', {
      headers: { 'Content-Type': 'application/xml' },
    })
  }

  const urls = rows.map(row => {
    const loc     = `${SITE_URL}/${row.categorySlug}/${row.slug}`
    const pubDate = new Date(row.publishedAt!).toISOString()
    return `  <url>
    <loc>${loc}</loc>
    <news:news>
      <news:publication>
        <news:name>${SITE_NAME}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title><![CDATA[${row.title}]]></news:title>
    </news:news>
  </url>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=300',
    },
  })
}
