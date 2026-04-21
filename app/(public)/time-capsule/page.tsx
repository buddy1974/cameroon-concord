import { db } from '@/lib/db/client'
import { articles } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'
import { SITE_URL } from '@/lib/constants'
import type { Metadata } from 'next'

export const revalidate = 86400

export const metadata: Metadata = {
  title: "CC Time Capsule — Cameroon Year by Year | Cameroon Concord",
  description: "A permanent record of Cameroon's history — every major event, crisis, and turning point, year by year since 2014.",
  alternates: { canonical: `${SITE_URL}/time-capsule` },
}

export default async function TimeCapsuleIndexPage() {
  const years = await db
    .select({ year: sql<number>`YEAR(published_at)` })
    .from(articles)
    .groupBy(sql`YEAR(published_at)`)
    .orderBy(sql`YEAR(published_at) DESC`)

  const validYears = years.map(r => r.year).filter(y => y >= 2014 && y <= new Date().getFullYear())

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#C8102E', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
        CC Time Capsule
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#F0F0F0', marginBottom: '8px', lineHeight: 1.2 }}>
        Cameroon: A Year-by-Year Record
      </h1>
      <p style={{ fontSize: '0.9rem', color: '#555', lineHeight: 1.7, marginBottom: '32px' }}>
        A permanent archive of Cameroon's history as reported by Cameroon Concord. Every major event, crisis, turning point and moment — preserved for the record.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {validYears.map(year => (
          <a key={year} href={`/time-capsule/${year}`}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '10px', textDecoration: 'none' }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F0F0F0' }}>{year}</div>
              <div style={{ fontSize: '0.72rem', color: '#555' }}>
                {year === new Date().getFullYear() ? 'Current year — updated continuously' : 'Full year record'}
              </div>
            </div>
            <div style={{ fontSize: '1rem', color: '#C8102E' }}>→</div>
          </a>
        ))}
      </div>
    </div>
  )
}
