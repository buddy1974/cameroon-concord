import { db } from '@/lib/db/client'
import { articles, categories, articleHits } from '@/lib/db/schema'
import { desc, eq, sql } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [totalArticles] = await db.select({ count: sql<number>`count(*)` }).from(articles)
  const [published]     = await db.select({ count: sql<number>`count(*)` }).from(articles).where(eq(articles.status, 'published'))
  const [drafts]        = await db.select({ count: sql<number>`count(*)` }).from(articles).where(eq(articles.status, 'draft'))

  const recent = await db
    .select({
      id:          articles.id,
      title:       articles.title,
      status:      articles.status,
      publishedAt: articles.publishedAt,
      catName:     categories.name,
      catSlug:     categories.slug,
      slug:        articles.slug,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .orderBy(desc(articles.publishedAt))
    .limit(10)

  const stats = [
    { label: 'Total Articles', value: Number(totalArticles.count).toLocaleString(), color: '#F5A623' },
    { label: 'Published',      value: Number(published.count).toLocaleString(),     color: '#22C55E' },
    { label: 'Drafts',         value: Number(drafts.count).toLocaleString(),        color: '#A855F7' },
    { label: 'AI Generated',   value: '—',                                          color: '#3B82F6' },
  ]

  let pwaStats = { click: 0, accepted: 0, installed: 0 }
  try {
    const rows = await db.execute(
      sql`SELECT event, COUNT(*) as count FROM pwa_events GROUP BY event`
    ) as { rows?: { event: string; count: string | number }[] } | { event: string; count: string | number }[]
    const data: { event: string; count: string | number }[] = Array.isArray(rows) ? rows : (rows as any).rows ?? []
    for (const r of data) {
      const k = r.event as keyof typeof pwaStats
      if (k in pwaStats) pwaStats[k] = Number(r.count)
    }
  } catch { /* table may not exist yet */ }

  // Top 10 articles by hits
  const topArticles = await db
    .select({
      id:      articles.id,
      title:   articles.title,
      slug:    articles.slug,
      hits:    articleHits.hits,
      catSlug: categories.slug,
    })
    .from(articles)
    .innerJoin(categories,   eq(articles.categoryId, categories.id))
    .leftJoin(articleHits,   eq(articles.id, articleHits.articleId))
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articleHits.hits))
    .limit(10)

  // Category performance — total hits per category
  const categoryStats = await db
    .select({
      category:     categories.name,
      slug:         categories.slug,
      totalHits:    sql<number>`COALESCE(SUM(${articleHits.hits}), 0)`,
      articleCount: sql<number>`COUNT(${articles.id})`,
    })
    .from(articles)
    .innerJoin(categories,  eq(articles.categoryId, categories.id))
    .leftJoin(articleHits,  eq(articles.id, articleHits.articleId))
    .where(eq(articles.status, 'published'))
    .groupBy(categories.id, categories.name, categories.slug)
    .orderBy(desc(sql`SUM(${articleHits.hits})`))

  const sectionHeading: React.CSSProperties = {
    color: '#F5A623',
    fontSize: '0.85rem',
    fontWeight: 700,
    marginBottom: '1rem',
    borderLeft: '3px solid #F5A623',
    paddingLeft: '10px',
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', margin: 0 }}>Dashboard</h1>
          <p style={{ color: '#444', fontSize: '0.8rem', marginTop: '4px' }}>Cameroon Concord CMS</p>
        </div>
        <Link href="/admin/articles/new" style={{
          background: '#C8102E', color: '#fff', padding: '10px 20px',
          borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
          textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          + New Article
        </Link>
      </div>

      {/* Stats row — 4 cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: '#0F0F0F',
            border: '1px solid #1A1A1A',
            borderTop: `3px solid ${s.color}`,
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: '#555', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* PWA Install Stats */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={sectionHeading}>PWA Install Funnel</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { label: 'Banner Clicks',  value: pwaStats.click,     color: '#3B82F6' },
            { label: 'User Accepted',  value: pwaStats.accepted,  color: '#22C55E' },
            { label: 'App Installed',  value: pwaStats.installed, color: '#C8102E' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#0F0F0F',
              border: '1px solid #1A1A1A',
              borderTop: `3px solid ${s.color}`,
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value.toLocaleString()}</div>
              <div style={{ fontSize: '0.72rem', color: '#555', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Articles by Hits */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={sectionHeading}>Top Articles by Hits</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333' }}>
              <th style={{ color: '#666', textAlign: 'left', padding: '8px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Title</th>
              <th style={{ color: '#666', textAlign: 'right', padding: '8px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hits</th>
            </tr>
          </thead>
          <tbody>
            {topArticles.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '10px 8px', fontSize: '0.8rem' }}>
                  <a href={`/${a.catSlug}/${a.slug}`} target="_blank" style={{ color: '#EEE', textDecoration: 'none' }}>
                    {a.title?.slice(0, 80)}
                  </a>
                </td>
                <td style={{ padding: '10px 8px', fontSize: '0.8rem', color: '#F5A623', textAlign: 'right', fontWeight: 700 }}>
                  {(a.hits || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Category Performance */}
      <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <h2 style={sectionHeading}>Category Performance</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333' }}>
              <th style={{ color: '#666', textAlign: 'left', padding: '8px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category</th>
              <th style={{ color: '#666', textAlign: 'right', padding: '8px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Articles</th>
              <th style={{ color: '#666', textAlign: 'right', padding: '8px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Hits</th>
            </tr>
          </thead>
          <tbody>
            {categoryStats.map(c => (
              <tr key={c.slug} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '10px 8px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F5A623', flexShrink: 0 }} />
                    <span style={{ color: '#EEE' }}>{c.category}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 8px', fontSize: '0.8rem', color: '#666', textAlign: 'right' }}>{Number(c.articleCount).toLocaleString()}</td>
                <td style={{ padding: '10px 8px', fontSize: '0.8rem', color: '#F5A623', textAlign: 'right', fontWeight: 700 }}>{Number(c.totalHits).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent articles table */}
      <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1A1A1A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F5A623', margin: 0, borderLeft: '3px solid #F5A623', paddingLeft: '10px' }}>Recent Articles</h2>
          <Link href="/admin/articles" style={{ fontSize: '0.72rem', color: '#C8102E', textDecoration: 'none' }}>View all →</Link>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {recent.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid #111' }}>
                <td style={{ padding: '12px 20px' }}>
                  <Link href={`/admin/articles/${a.id}/edit`} style={{ color: '#EEE', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 500 }}>
                    {a.title}
                  </Link>
                  <div style={{ fontSize: '0.65rem', color: '#555', marginTop: '2px' }}>{a.catName}</div>
                </td>
                <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                  <Link href={`/admin/articles/${a.id}/edit`} style={{ textDecoration: 'none' }}>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
                      background: a.status === 'published' ? 'rgba(34,197,94,0.12)' : 'rgba(168,85,247,0.12)',
                      color: a.status === 'published' ? '#22C55E' : '#A855F7',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                      {a.status}
                    </span>
                  </Link>
                </td>
                <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Link href={`/admin/articles/${a.id}/edit`}
                      style={{ fontSize: '0.7rem', color: '#555', textDecoration: 'none', padding: '4px 10px', border: '1px solid #1E1E1E', borderRadius: '6px' }}>
                      Edit
                    </Link>
                    <Link href={`/${a.catSlug}/${a.slug}`} target="_blank"
                      style={{ fontSize: '0.7rem', color: '#555', textDecoration: 'none', padding: '4px 10px', border: '1px solid #1E1E1E', borderRadius: '6px' }}>
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
