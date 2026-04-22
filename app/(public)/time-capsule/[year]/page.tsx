import { db } from '@/lib/db/client'
import { articles, categories } from '@/lib/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/constants'
import type { Metadata } from 'next'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }): Promise<Metadata> {
  const { year } = await params
  return {
    title: `Cameroon ${year}: The Year in Review | Cameroon Concord`,
    description: `Everything that happened in Cameroon in ${year} — politics, the Anglophone crisis, economy, sport and society, as reported by Cameroon Concord.`,
    alternates: { canonical: `${SITE_URL}/time-capsule/${year}` },
  }
}

export default async function TimeCapsuleYearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params
  const yearNum = parseInt(year)
  if (isNaN(yearNum) || yearNum < 2014 || yearNum > new Date().getFullYear() + 1) notFound()

  type YearArticle = { id: number; title: string; slug: string; publishedAt: Date | null; category: { name: string; slug: string } }
  let yearArticles: YearArticle[] = []
  try {
    yearArticles = await db
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
          sql`YEAR(${articles.publishedAt}) = ${yearNum}`
        )
      )
      .orderBy(desc(articles.publishedAt))
      .limit(200)
  } catch {
    // DB unavailable at render time
  }

  if (yearArticles.length === 0) notFound()

  const byMonth: Record<string, typeof yearArticles> = {}
  yearArticles.forEach(a => {
    const month = new Date(a.publishedAt!).toLocaleString('en-GB', { month: 'long' })
    if (!byMonth[month]) byMonth[month] = []
    byMonth[month].push(a)
  })

  const months = Object.keys(byMonth)

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <a href="/time-capsule" style={{ fontSize: '0.72rem', color: '#555', textDecoration: 'none' }}>← Time Capsule</a>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#C8102E', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '16px 0 8px' }}>
        CC Time Capsule
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#F0F0F0', marginBottom: '8px' }}>
        Cameroon in {yearNum}
      </h1>
      <p style={{ fontSize: '0.82rem', color: '#555', marginBottom: '32px' }}>
        {yearArticles.length} stories published — a complete record of the year.
      </p>

      {months.map(month => (
        <div key={month} style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F5A623', textTransform: 'uppercase', letterSpacing: '0.1em', borderLeft: '3px solid #F5A623', paddingLeft: '10px', marginBottom: '12px' }}>
            {month} {yearNum}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {byMonth[month].map(a => (
              <a key={a.id} href={`/${a.category.slug}/${a.slug}`}
                style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderBottom: '1px solid #111', textDecoration: 'none', alignItems: 'baseline' }}>
                <div style={{ fontSize: '0.85rem', color: '#C0C0C0', fontWeight: 500, lineHeight: 1.4, flex: 1 }}>
                  {a.title}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#444', flexShrink: 0 }}>
                  {new Date(a.publishedAt!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
