import { db } from '@/lib/db/client'
import { articles, categories } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const rows = await db
    .select({
      id:    categories.id,
      slug:  categories.slug,
      name:  categories.name,
      count: sql<number>`count(${articles.id})`,
    })
    .from(categories)
    .leftJoin(articles, eq(articles.categoryId, categories.id))
    .groupBy(categories.id, categories.slug, categories.name)
    .orderBy(categories.name)

  return (
    <div>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', marginBottom: '24px' }}>Categories</h1>
      <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1A1A1A' }}>
              {['Category', 'Slug', 'Articles'].map(h => (
                <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: '0.62rem', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #111' }}>
                <td style={{ padding: '12px 20px', fontSize: '0.85rem', color: '#EEE', fontWeight: 500 }}>{r.name}</td>
                <td style={{ padding: '12px 20px', fontSize: '0.75rem', color: '#555', fontFamily: 'monospace' }}>/{r.slug}</td>
                <td style={{ padding: '12px 20px' }}>
                  <Link href={`/admin/articles?category=${r.slug}`}
                    style={{ fontSize: '0.82rem', color: '#C8102E', textDecoration: 'none', fontWeight: 700 }}>
                    {Number(r.count).toLocaleString()}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
