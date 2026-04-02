export const revalidate = 3600

import { getLatestArticles } from '@/lib/db/queries'
import { SITE_NAME, SITE_URL } from '@/lib/constants'

export async function GET() {
  const articles = await getLatestArticles(50)

  const items = articles
    .filter(a => a.publishedAt)
    .map(a => {
      const url     = `${SITE_URL}/${a.category.slug}/${a.slug}`
      const date    = new Date(a.publishedAt!).toUTCString()
      const isoDate = new Date(a.publishedAt!).toISOString()
      const image   = a.featuredImage || ''
      return `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${date}</pubDate>
      <description><![CDATA[${a.excerpt || ''}]]></description>
      <category><![CDATA[${a.category.name}]]></category>
      ${image ? `<enclosure url="${image}" type="image/jpeg" />` : ''}
      <news:news>
        <news:publication>
          <news:name>${SITE_NAME}</news:name>
          <news:language>en</news:language>
        </news:publication>
        <news:publication_date>${isoDate}</news:publication_date>
        <news:title><![CDATA[${a.title}]]></news:title>
        <news:keywords>${a.category.name}, Cameroon, Africa</news:keywords>
      </news:news>
      <media:content url="${image}" medium="image" />
    </item>`
    }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom"
>
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>Latest news from ${SITE_NAME} — Cameroon and Southern Cameroons</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/api/rss" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/icons/logo.png</url>
      <title>${SITE_NAME}</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
