'use client'
import { useState } from 'react'

type Comment = {
  id: number
  parentId?: number
  authorName: string
  authorIsAdmin: number
  body: string
  createdAt: string
}

export default function CommentsSection({ articleId }: { articleId: number }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [form, setForm] = useState({ authorName: '', authorEmail: '', text: '', notifyEmail: false })
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')

  async function loadComments() {
    setLoading(true)
    const res = await fetch(`/api/comments?articleId=${articleId}`)
    const data = await res.json()
    setComments(Array.isArray(data) ? data : [])
    setLoaded(true)
    setLoading(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.authorName || !form.authorEmail || !form.text) return
    setSubmitting(true)
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, articleId, parentId: replyTo })
    })
    const data = await res.json()
    setSubmitting(false)
    if (data.success) {
      setMsg(data.message)
      setForm({ authorName: '', authorEmail: '', text: '', notifyEmail: false })
      setReplyTo(null)
      if (!data.pending) loadComments()
    } else {
      setMsg(data.error || 'Failed to post comment.')
    }
  }

  const topLevel = comments.filter(c => !c.parentId)
  const replies = (parentId: number) => comments.filter(c => c.parentId === parentId)

  const CommentCard = ({ c, isReply = false }: { c: Comment; isReply?: boolean }) => (
    <div style={{
      marginLeft: isReply ? '32px' : '0',
      marginBottom: '16px',
      padding: '16px',
      background: c.authorIsAdmin ? '#0a1628' : '#111',
      border: `1px solid ${c.authorIsAdmin ? '#1a3a6a' : '#222'}`,
      borderRadius: '8px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: c.authorIsAdmin ? '#C8102E' : '#333',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', fontWeight: 700, color: '#fff', flexShrink: 0
          }}>
            {c.authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <span style={{ fontWeight: 700, color: c.authorIsAdmin ? '#C8102E' : '#fff', fontSize: '0.9rem' }}>
              {c.authorName}
            </span>
            {c.authorIsAdmin ? <span style={{ fontSize: '0.7rem', background: '#C8102E', color: '#fff', padding: '1px 6px', borderRadius: '3px', marginLeft: '6px' }}>CC Staff</span> : null}
          </div>
        </div>
        <span style={{ color: '#555', fontSize: '0.75rem' }}>
          {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
      <p style={{ color: '#ccc', margin: '0 0 10px', lineHeight: 1.6, fontSize: '0.9rem' }}>{c.body}</p>
      {!isReply && (
        <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
          style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>
          {replyTo === c.id ? '↩ Cancel' : '↩ Reply'}
        </button>
      )}
      {replyTo === c.id && <CommentForm parentId={c.id} />}
      {replies(c.id).map(r => <CommentCard key={r.id} c={r} isReply />)}
    </div>
  )

  const CommentForm = ({ parentId }: { parentId?: number }) => (
    <form onSubmit={submit} style={{ marginTop: parentId ? '12px' : '0' }}>
      {!parentId && (
        <div className="comment-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <input placeholder="Your name *" value={form.authorName}
            onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))}
            style={{ background: '#111', border: '1px solid #333', borderRadius: '6px', padding: '10px 14px', color: '#fff', fontSize: '0.9rem', outline: 'none' }} />
          <input placeholder="Your email *" type="email" value={form.authorEmail}
            onChange={e => setForm(f => ({ ...f, authorEmail: e.target.value }))}
            style={{ background: '#111', border: '1px solid #333', borderRadius: '6px', padding: '10px 14px', color: '#fff', fontSize: '0.9rem', outline: 'none' }} />
        </div>
      )}
      <textarea placeholder={parentId ? 'Write a reply...' : 'Join the discussion...'}
        value={form.text} rows={parentId ? 2 : 4}
        onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
        style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: '6px', padding: '10px 14px', color: '#fff', fontSize: '0.9rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
      {!parentId && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.notifyEmail}
            onChange={e => setForm(f => ({ ...f, notifyEmail: e.target.checked }))} />
          <span style={{ color: '#666', fontSize: '0.8rem' }}>Notify me by email when someone replies</span>
        </label>
      )}
      <button type="submit" disabled={submitting} style={{
        marginTop: '10px', background: '#C8102E', color: '#fff', border: 'none',
        padding: '10px 24px', borderRadius: '6px', cursor: submitting ? 'not-allowed' : 'pointer',
        fontWeight: 700, fontSize: '0.9rem'
      }}>
        {submitting ? 'Posting...' : parentId ? 'Reply' : 'Post Comment'}
      </button>
    </form>
  )

  return (
    <div style={{ marginTop: '48px', borderTop: '1px solid #222', paddingTop: '32px' }}>
      <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>
        Discussion {loaded && comments.length > 0 ? `(${comments.length})` : ''}
      </h3>

      {!loaded ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <button onClick={loadComments} disabled={loading} style={{
            background: '#C8102E', color: '#fff', border: 'none', padding: '10px 28px',
            borderRadius: '6px', cursor: 'pointer', fontWeight: 700
          }}>
            {loading ? 'Loading...' : 'Load Comments'}
          </button>
        </div>
      ) : (
        <>
          {topLevel.length > 0 ? topLevel.map(c => <CommentCard key={c.id} c={c} />) : (
            <p style={{ color: '#555', marginBottom: '24px' }}>Be the first to comment.</p>
          )}
        </>
      )}

      <div style={{ marginTop: '32px', background: '#0f0f0f', border: '1px solid #222', borderRadius: '10px', padding: '24px' }}>
        <h4 style={{ color: '#fff', margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>Leave a Comment</h4>
        {msg ? (
          <div style={{ padding: '12px 16px', background: '#0a2a0a', border: '1px solid #007A3D', borderRadius: '6px', color: '#4ade80', marginBottom: '16px' }}>{msg}</div>
        ) : null}
        <CommentForm />
      </div>
    </div>
  )
}
