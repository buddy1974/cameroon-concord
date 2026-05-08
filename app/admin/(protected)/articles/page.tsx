'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface ArticleRow {
  id: number; title: string; slug: string; status: string
  publishedAt: string | null; category: string; catSlug: string
  hits?: number; isBreaking?: boolean
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  published: { bg: 'rgba(34,197,94,0.12)',    text: '#22C55E' },
  draft:     { bg: 'rgba(168,85,247,0.12)',   text: '#A855F7' },
  archived:  { bg: 'rgba(100,100,100,0.12)',  text: '#555'    },
}

function timeAgo(d: string | null): string {
  if (!d) return '—'
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 60)   return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function ArticlesListPage() {
  const urlParams    = useSearchParams()
  const statusFilter = urlParams.get('status') || ''

  const [articles,    setArticles]    = useState<ArticleRow[]>([])
  const [total,       setTotal]       = useState(0)
  const [page,        setPage]        = useState(1)
  const [search,      setSearch]      = useState('')
  const [loading,     setLoading]     = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [deleting,    setDeleting]    = useState(false)
  const [breaking,    setBreaking]    = useState(false)
  const [viewMode,    setViewMode]    = useState<'card' | 'table'>('card')

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

  const displayed = breaking ? articles.filter(a => a.isBreaking) : articles
  const totalPages = Math.ceil(total / 20) || 1

  const heading = statusFilter === 'draft' ? '📝 Drafts' : '📰 Articles'
  const statusC = STATUS_COLORS

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>
          {heading} <span style={{ color: '#2A2A2A', fontSize: '0.9rem' }}>({total.toLocaleString()})</span>
        </h1>
        <button
          onClick={() => setViewMode(v => v === 'card' ? 'table' : 'card')}
          title="Toggle view"
          style={{ background: '#111', border: '1px solid #222', color: '#555', padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
        >
          {viewMode === 'card' ? '⊟ Table' : '⊞ Cards'}
        </button>
        <button
          onClick={async () => {
            if (!confirm('Remove breaking flag from ALL articles?')) return
            await fetch('/api/admin/articles/kill-breaking', { method: 'POST' })
            load()
          }}
          style={{ background: '#1A0000', color: '#C8102E', border: '1px solid #C8102E', padding: '7px 12px', borderRadius: 7, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
        >
          🚨 Kill Breaking
        </button>
        <Link href="/admin/articles/new" style={{
          background: '#C8102E', color: '#fff', padding: '9px 18px',
          borderRadius: 8, fontSize: '0.78rem', fontWeight: 900,
          textDecoration: 'none',
        }}>
          + New
        </Link>
      </div>

      {/* ── Search + filter bar ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="🔍 Search articles..."
          style={{
            flex: 1, minWidth: 160,
            background: '#0D0D0D', border: '1px solid #1E1E1E',
            borderRadius: 8, padding: '10px 14px', color: '#EEE',
            fontSize: '0.88rem', outline: 'none',
          }}
        />
        <button
          onClick={() => setBreaking(!breaking)}
          style={{
            background: breaking ? '#C8102E' : '#0D0D0D',
            color: breaking ? '#fff' : '#C8102E',
            border: '1px solid #C8102E', borderRadius: 7,
            padding: '8px 14px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
          }}
        >
          🚨 Breaking
        </button>
        {['', 'draft', 'published', 'archived'].map(s => (
          <a key={s} href={s ? `/admin/articles?status=${s}` : '/admin/articles'} style={{
            padding: '8px 12px', borderRadius: 7,
            background: statusFilter === s ? '#C8102E' : '#0D0D0D',
            color: statusFilter === s ? '#fff' : '#555',
            border: '1px solid #1A1A1A',
            fontSize: '0.68rem', fontWeight: 700, textDecoration: 'none',
            display: 'inline-block',
          }}>
            {s || 'All'}
          </a>
        ))}
      </div>

      {/* ── Bulk action bar ── */}
      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#1a0000', border: '1px solid #C8102E', borderRadius: 8, marginBottom: 12 }}>
          <span style={{ color: '#fff', fontSize: '0.82rem' }}>{selectedIds.size} selected</span>
          <button
            disabled={deleting}
            onClick={async () => {
              if (!confirm(`Delete ${selectedIds.size} article(s)? Cannot be undone.`)) return
              setDeleting(true)
              await Promise.all([...selectedIds].map(id => fetch(`/api/admin/articles/${id}`, { method: 'DELETE', credentials: 'include' })))
              setDeleting(false); setSelectedIds(new Set()); load()
            }}
            style={{ background: '#C8102E', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 6, cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
          >
            {deleting ? 'Deleting…' : '🗑 Delete Selected'}
          </button>
          <button onClick={() => setSelectedIds(new Set())} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.78rem' }}>✕ Cancel</button>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#2A2A2A', fontSize: '0.9rem' }}>Loading…</div>
      ) : displayed.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#2A2A2A', fontSize: '0.85rem', background: '#0D0D0D', borderRadius: 12, border: '1px solid #111' }}>
          No articles found
        </div>
      ) : viewMode === 'card' ? (

        /* ══════════ CARD VIEW (mobile-first) ══════════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayed.map(a => {
            const sc = statusC[a.status] ?? statusC.archived
            const selected = selectedIds.has(a.id)
            return (
              <div key={a.id} style={{
                background: selected ? '#1A0A0A' : '#0D0D0D',
                border: `1px solid ${selected ? '#C8102E' : '#1A1A1A'}`,
                borderRadius: 12, overflow: 'hidden',
                display: 'flex', alignItems: 'stretch',
              }}>
                {/* Select strip */}
                <button
                  onClick={() => {
                    const n = new Set(selectedIds)
                    selected ? n.delete(a.id) : n.add(a.id)
                    setSelectedIds(n)
                  }}
                  style={{
                    width: 36, flexShrink: 0,
                    background: selected ? '#C8102E' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: selected ? '#fff' : '#252525', fontSize: '0.7rem',
                  }}
                  title="Select"
                >
                  {selected ? '✓' : '◻'}
                </button>

                {/* Main content */}
                <div style={{ flex: 1, padding: '12px 12px 12px 10px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 5 }}>
                    {a.isBreaking && (
                      <span style={{ fontSize: '0.48rem', background: '#C8102E', color: '#fff', padding: '2px 6px', borderRadius: 3, fontWeight: 900, letterSpacing: '0.1em', flexShrink: 0, marginTop: 2 }}>BREAKING</span>
                    )}
                    <Link href={`/admin/articles/${a.id}/edit`} style={{
                      fontSize: '0.85rem', fontWeight: 700, color: '#ddd',
                      textDecoration: 'none', lineHeight: 1.35,
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {a.title}
                    </Link>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.58rem', background: sc.bg, color: sc.text, padding: '2px 7px', borderRadius: 20, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{a.status}</span>
                    <span style={{ fontSize: '0.62rem', color: '#333' }}>{a.category}</span>
                    <span style={{ fontSize: '0.62rem', color: '#252525' }}>{timeAgo(a.publishedAt)}</span>
                    {(a.hits ?? 0) > 0 && <span style={{ fontSize: '0.62rem', color: '#F5A623' }}>👁 {a.hits?.toLocaleString()}</span>}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: 8, flexShrink: 0 }}>
                  <Link href={`/admin/articles/${a.id}/edit`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#C8102E', color: '#fff',
                    padding: '8px 16px', borderRadius: 8,
                    fontSize: '0.72rem', fontWeight: 900, textDecoration: 'none',
                    letterSpacing: '0.04em',
                  }}>
                    EDIT
                  </Link>
                  <Link href={`/${a.catSlug}/${a.slug}`} target="_blank" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#151515', color: '#444',
                    padding: '6px 12px', borderRadius: 6,
                    fontSize: '0.65rem', fontWeight: 700, textDecoration: 'none',
                  }}>
                    ↗ View
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

      ) : (

        /* ══════════ TABLE VIEW (desktop) ══════════ */
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #111' }}>
                <th style={{ width: 36, padding: '10px 14px' }}>
                  <input type="checkbox" onChange={e => e.target.checked ? setSelectedIds(new Set(displayed.map(a => a.id))) : setSelectedIds(new Set())} />
                </th>
                {['Title', 'Category', 'Status', 'Date', 'Reads', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.55rem', fontWeight: 700, color: '#2A2A2A', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map(a => {
                const sc = statusC[a.status] ?? statusC.archived
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #080808' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <input type="checkbox" checked={selectedIds.has(a.id)} onChange={e => {
                        const n = new Set(selectedIds)
                        e.target.checked ? n.add(a.id) : n.delete(a.id)
                        setSelectedIds(n)
                      }} />
                    </td>
                    <td style={{ padding: '10px 14px', maxWidth: 380 }}>
                      <Link href={`/admin/articles/${a.id}/edit`} style={{ color: '#bbb', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
                        {a.isBreaking && <span style={{ fontSize: '0.5rem', background: '#C8102E', color: '#fff', padding: '1px 5px', borderRadius: 3, marginRight: 6, fontWeight: 900 }}>BREAKING</span>}
                        {a.title}
                      </Link>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '0.7rem', color: '#444', whiteSpace: 'nowrap' }}>{a.category}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.text, textTransform: 'uppercase' }}>{a.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '0.7rem', color: '#333', whiteSpace: 'nowrap' }}>{timeAgo(a.publishedAt)}</td>
                    <td style={{ padding: '10px 14px', fontSize: '0.7rem', color: '#F5A623', textAlign: 'right', fontWeight: 700 }}>{(a.hits || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <Link href={`/admin/articles/${a.id}/edit`} style={{ fontSize: '0.65rem', background: '#C8102E', color: '#fff', padding: '4px 10px', borderRadius: 5, textDecoration: 'none', fontWeight: 700 }}>Edit</Link>
                        <Link href={`/${a.catSlug}/${a.slug}`} target="_blank" style={{ fontSize: '0.65rem', background: '#181818', color: '#555', padding: '4px 8px', borderRadius: 5, textDecoration: 'none', border: '1px solid #1E1E1E' }}>↗</Link>
                        {a.isBreaking && (
                          <button onClick={async () => { await fetch(`/api/admin/articles/${a.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isBreaking: false }) }); load() }}
                            style={{ fontSize: '0.6rem', background: '#7A0000', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontWeight: 700 }}>
                            ✕ Brk
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
        {page > 1 && (
          <button onClick={() => setPage(p => p - 1)} style={{ background: '#0D0D0D', border: '1px solid #1E1E1E', color: '#888', padding: '8px 18px', borderRadius: 7, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
            ← Prev
          </button>
        )}
        <span style={{ padding: '8px 14px', fontSize: '0.72rem', color: '#333' }}>
          {page} / {totalPages}
        </span>
        {page < totalPages && (
          <button onClick={() => setPage(p => p + 1)} style={{ background: '#0D0D0D', border: '1px solid #1E1E1E', color: '#888', padding: '8px 18px', borderRadius: 7, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
            Next →
          </button>
        )}
      </div>
    </div>
  )
}
