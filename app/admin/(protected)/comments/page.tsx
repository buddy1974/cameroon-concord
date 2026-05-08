'use client'
import { useEffect, useState } from 'react'

type Comment = {
  id: number
  articleId: number
  articleTitle?: string
  parentId?: number
  authorName: string
  authorEmail: string
  body: string
  status: string
  flagged: number
  flagReason?: string
  ipAddress?: string
  createdAt: string
}

export default function CommentsAdmin() {
  const [comments, setComments] = useState<Comment[]>([])
  const [filter, setFilter] = useState<'pending'|'approved'|'spam'|'flagged'>('pending')
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [total, setTotal]     = useState(0)
  const limit = 50

  useEffect(() => { setPage(1) }, [filter])
  useEffect(() => { load() }, [filter, page])

  async function load() {
    setLoading(true)
    const res  = await fetch(`/api/admin/comments?status=${filter}&page=${page}`, { credentials: 'include' })
    const data = await res.json()
    setComments(data.rows ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }

  async function action(id: number, act: string, extra?: Record<string, unknown>) {
    await fetch(`/api/admin/comments/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: act, ...extra })
    })
    load()
  }

  async function postAsCC(id: number, articleId: number) {
    const text = prompt('Reply as Cameroon Concord:')
    if (!text) return
    await fetch('/api/admin/comments/reply', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, parentId: id, text })
    })
    load()
  }

  async function banUser(comment: Comment, type: 'ip' | 'email') {
    const value  = type === 'ip' ? comment.ipAddress : comment.authorEmail
    const reason = prompt(`Ban reason for ${type}: ${value}`) || 'Offensive content'
    await fetch('/api/admin/comments/ban', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value, reason })
    })
    action(comment.id, 'spam')
  }

  const tabs  = ['pending','approved','flagged','spam']
  const pages = Math.ceil(total / limit)

  return (
    <div style={{ padding: '24px', color: '#fff', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>Comments</h1>
      <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '20px' }}>{total} total in this view</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t as any)} style={{
            padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            background: filter === t ? '#C8102E' : '#1a1a1a',
            color: '#fff', fontWeight: filter === t ? 700 : 400, textTransform: 'capitalize'
          }}>{t}</button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#666' }}>Loading...</p>
      ) : comments.length === 0 ? (
        <p style={{ color: '#666' }}>No {filter} comments.</p>
      ) : (
        <>
          {comments.map(c => (
            <div key={c.id} style={{
              background: c.flagged ? '#1a0800' : '#0f0f0f',
              border: `1px solid ${c.flagged ? '#C8102E' : '#1a1a1a'}`,
              borderRadius: '8px', padding: '16px', marginBottom: '12px'
            }}>
              {/* Article title link */}
              {c.articleTitle && (
                <div style={{ marginBottom: '8px' }}>
                  <a
                    href={`/admin/articles/${c.articleId}/edit`}
                    style={{ fontSize: '0.78rem', color: '#888', textDecoration: 'none' }}
                  >
                    📄 {c.articleTitle}
                  </a>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{c.authorName}</span>
                  <span style={{ color: '#666', fontSize: '0.8rem', marginLeft: '8px' }}>{c.authorEmail}</span>
                  {c.ipAddress && <span style={{ color: '#444', fontSize: '0.75rem', marginLeft: '8px' }}>IP: {c.ipAddress}</span>}
                  {c.parentId && <span style={{ color: '#555', fontSize: '0.75rem', marginLeft: '8px' }}>↩ reply</span>}
                </div>
                <span style={{ color: '#666', fontSize: '0.75rem' }}>{new Date(c.createdAt).toLocaleString()}</span>
              </div>

              {c.flagged ? (
                <div style={{ background: '#2a0000', padding: '6px 10px', borderRadius: '4px', marginBottom: '8px', fontSize: '0.8rem', color: '#ff6b6b' }}>
                  🚩 AI flagged: {c.flagReason || 'no reason stored'}
                </div>
              ) : null}

              <p style={{ color: '#ccc', margin: '0 0 12px', lineHeight: 1.5 }}>{c.body}</p>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {c.status !== 'approved' && (
                  <button onClick={() => action(c.id, 'approve')} style={{ background: '#007A3D', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>✓ Approve</button>
                )}
                {c.status !== 'spam' && (
                  <button onClick={() => action(c.id, 'spam')} style={{ background: '#555', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Spam</button>
                )}
                <button onClick={() => action(c.id, 'delete')} style={{ background: '#C8102E', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                <button onClick={() => postAsCC(c.id, c.articleId)} style={{ background: '#1a1a4e', color: '#fff', border: '1px solid #333', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Reply as CC</button>
                <button onClick={() => banUser(c, 'ip')} style={{ background: '#2a1a00', color: '#ff9900', border: '1px solid #ff9900', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Ban IP</button>
                <button onClick={() => banUser(c, 'email')} style={{ background: '#2a1a00', color: '#ff9900', border: '1px solid #ff9900', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Ban Email</button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '24px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer', background: '#1a1a1a', color: page === 1 ? '#444' : '#fff' }}
              >← Prev</button>
              <span style={{ color: '#666', fontSize: '0.85rem' }}>Page {page} of {pages}</span>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: page === pages ? 'not-allowed' : 'pointer', background: '#1a1a1a', color: page === pages ? '#444' : '#fff' }}
              >Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
