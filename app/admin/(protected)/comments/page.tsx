'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Comment = {
  id: number
  articleId: number
  articleTitle?: string
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
  const router = useRouter()

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/admin/comments?status=${filter}`, { credentials: 'include' })
    const data = await res.json()
    setComments(data)
    setLoading(false)
  }

  async function action(id: number, act: string, extra?: any) {
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

  async function banUser(comment: Comment, type: 'ip'|'email') {
    const value = type === 'ip' ? comment.ipAddress : comment.authorEmail
    const reason = prompt(`Ban reason for ${type}: ${value}`) || 'Offensive content'
    await fetch('/api/admin/comments/ban', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value, reason })
    })
    action(comment.id, 'spam')
  }

  const tabs = ['pending','approved','flagged','spam']

  return (
    <div style={{ padding: '24px', color: '#fff', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>Comments</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t as any)} style={{
            padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            background: filter === t ? '#C8102E' : '#1a1a1a',
            color: '#fff', fontWeight: filter === t ? 700 : 400, textTransform: 'capitalize'
          }}>{t}</button>
        ))}
      </div>

      {loading ? <p style={{ color: '#666' }}>Loading...</p> : comments.length === 0 ? (
        <p style={{ color: '#666' }}>No {filter} comments.</p>
      ) : comments.map(c => (
        <div key={c.id} style={{
          background: c.flagged ? '#1a0800' : '#0f0f0f',
          border: `1px solid ${c.flagged ? '#C8102E' : '#1a1a1a'}`,
          borderRadius: '8px', padding: '16px', marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <span style={{ fontWeight: 700 }}>{c.authorName}</span>
              <span style={{ color: '#666', fontSize: '0.8rem', marginLeft: '8px' }}>{c.authorEmail}</span>
              {c.ipAddress && <span style={{ color: '#444', fontSize: '0.75rem', marginLeft: '8px' }}>IP: {c.ipAddress}</span>}
            </div>
            <span style={{ color: '#666', fontSize: '0.75rem' }}>{new Date(c.createdAt).toLocaleString()}</span>
          </div>

          {c.flagged ? <div style={{ background: '#2a0000', padding: '6px 10px', borderRadius: '4px', marginBottom: '8px', fontSize: '0.8rem', color: '#ff6b6b' }}>
            🚩 AI flagged: {c.flagReason}
          </div> : null}

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
    </div>
  )
}
