import { db } from '@/lib/db/client'
import { articles, categories } from '@/lib/db/schema'
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
    { label: 'Total Articles', value: Number(totalArticles.count).toLocaleString(), color: '#C8102E' },
    { label: 'Published',      value: Number(published.count).toLocaleString(),     color: '#007A3D' },
    { label: 'Drafts',         value: Number(drafts.count).toLocaleString(),        color: '#F5A623' },
  ]

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

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: '#444', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent articles table */}
      <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1A1A1A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#EEE', margin: 0 }}>Recent Articles</h2>
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
                  <div style={{ fontSize: '0.65rem', color: '#444', marginTop: '2px' }}>{a.catName}</div>
                </td>
                <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
                    background: a.status === 'published' ? 'rgba(0,122,61,0.12)' : 'rgba(245,166,35,0.12)',
                    color: a.status === 'published' ? '#007A3D' : '#F5A623',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    {a.status}
                  </span>
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
