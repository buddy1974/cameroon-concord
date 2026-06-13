export const revalidate = 300

import { getLatestArticles } from '@/lib/db/queries'
import { SITE_NAME, SITE_URL } from '@/lib/constants'

const EMPTY_RSS = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Cameroon Concord</title></channel></rss>`

function cdata(value: string): string {
  return value.normalize('NFC').replaceAll(']]>', ']]]]><![CDATA[>')
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export async function GET() {
  let articles: Awaited<ReturnType<typeof getLatestArticles>> = []
  try { articles = await getLatestArticles(50) } catch {
    return new Response(EMPTY_RSS, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
  }

  const items = articles
    .filter(a => a.publishedAt)
    .map(a => {
      const url     = `${SITE_URL}/${a.category.slug}/${a.slug}`
      const date    = new Date(a.publishedAt!).toUTCString()
      const isoDate = new Date(a.publishedAt!).toISOString()
      const image   = a.featuredImage || ''
      const excerpt = (a.excerpt || '').replace(/[\r\n]+/g, ' ').trim()
      const keywords = `${a.category.name}, Cameroon, Africa`
      return `
    <item>
      <title><![CDATA[${cdata(a.title)}]]></title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${date}</pubDate>
      <description><![CDATA[${cdata(excerpt)}]]></description>
      <category><![CDATA[${cdata(a.category.name)}]]></category>
      ${image ? `<enclosure url="${escapeXml(image)}" type="image/jpeg" />` : ''}
      <news:news>
        <news:publication>
          <news:name>${SITE_NAME}</news:name>
          <news:language>en</news:language>
        </news:publication>
        <news:publication_date>${isoDate}</news:publication_date>
        <news:title><![CDATA[${cdata(a.title)}]]></news:title>
        <news:keywords>${escapeXml(keywords)}</news:keywords>
      </news:news>
      ${image ? `<media:content url="${escapeXml(image)}" medium="image" />` : ''}
    </item>`
    }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom"
>
  <channel>
    <title>${SITE_NAME}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>Latest news from ${SITE_NAME} - Cameroon and Southern Cameroons</description>
    <language>en</language>
    <atom:link href="${escapeXml(`${SITE_URL}/rss.xml`)}" rel="self" type="application/rss+xml" />
    <image>
      <url>${escapeXml(`${SITE_URL}/icons/logo.png`)}</url>
      <title>${SITE_NAME}</title>
      <link>${escapeXml(SITE_URL)}</link>
    </image>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300',
    },
  })
}
