'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface ArticleRow {
  id: number; title: string; slug: string; status: string
  publishedAt: string | null; category: string; catSlug: string
}

export default function ArticlesListPage() {
  const urlParams = useSearchParams()
  const statusFilter = urlParams.get('status') || ''

  const [articles, setArticles] = useState<ArticleRow[]>([])
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), q: search })
    if (statusFilter) params.set('status', statusFilter)
    const res  = await fetch(`/api/admin/articles?${params}`)
    const data = await res.json() as { articles: ArticleRow[]; total: number }
    setArticles(data.articles)
    setTotal(data.total)
    setLoading(false)
  }, [page, search, statusFilter])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', margin: 0 }}>
          {statusFilter === 'draft' ? 'Drafts' : 'Articles'} <span style={{ color: '#333', fontSize: '1rem' }}>({total.toLocaleString()})</span>
        </h1>
        <Link href="/admin/articles/new" style={{
          background: '#C8102E', color: '#fff', padding: '8px 16px',
          borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
          textDecoration: 'none', textTransform: 'uppercase',
        }}>
          + New
        </Link>
      </div>

      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1) }}
        placeholder="Search articles..."
        style={{
          width: '100%', background: '#0F0F0F', border: '1px solid #1E1E1E',
          borderRadius: '8px', padding: '10px 14px', color: '#EEE',
          fontSize: '0.88rem', outline: 'none', marginBottom: '16px',
          boxSizing: 'border-box',
        }}
      />

      <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#444', fontSize: '0.8rem' }}>Loading...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1A1A1A' }}>
                {['Title', 'Category', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.62rem', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {articles.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #0D0D0D' }}>
                  <td style={{ padding: '10px 16px', maxWidth: '400px' }}>
                    <Link href={`/admin/articles/${a.id}/edit`} style={{ color: '#CCC', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 500 }}>
                      {a.title}
                    </Link>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '0.72rem', color: '#555' }}>{a.category}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      fontSize: '0.58rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                      background: a.status === 'published' ? 'rgba(0,122,61,0.12)' : '#1A1A1A',
                      color: a.status === 'published' ? '#007A3D' : '#555',
                      textTransform: 'uppercase',
                    }}>
                      {a.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '0.72rem', color: '#555', whiteSpace: 'nowrap' }}>
                    {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Link href={`/admin/articles/${a.id}/edit`}
                        style={{ fontSize: '0.68rem', color: '#555', textDecoration: 'none', padding: '3px 8px', border: '1px solid #1E1E1E', borderRadius: '4px' }}>
                        Edit
                      </Link>
                      <Link href={`/${a.catSlug}/${a.slug}`} target="_blank"
                        style={{ fontSize: '0.68rem', color: '#555', textDecoration: 'none', padding: '3px 8px', border: '1px solid #1E1E1E', borderRadius: '4px' }}>
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
        {page > 1 && (
          <button onClick={() => setPage(p => p - 1)} style={{ background: '#111', border: '1px solid #1E1E1E', color: '#888', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>← Prev</button>
        )}
        <span style={{ padding: '6px 14px', fontSize: '0.75rem', color: '#555' }}>
          Page {page} of {Math.ceil(total / 20) || 1}
        </span>
        {page * 20 < total && (
          <button onClick={() => setPage(p => p + 1)} style={{ background: '#111', border: '1px solid #1E1E1E', color: '#888', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>Next →</button>
        )}
      </div>
    </div>
  )
}
