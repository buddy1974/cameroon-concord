'use client'
import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import Script from 'next/script'
import type { Comment } from '@/lib/types'
import { formatRelative } from '@/lib/utils'

interface Props { articleId: number }

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'

export function CommentSection({ articleId }: Props) {
  const [comments,   setComments]   = useState<Comment[]>([])
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [error,      setError]      = useState('')
  const [form, setForm] = useState({
    authorName: '', authorEmail: '', body: '',
  })
  const [cfToken, setCfToken] = useState('')

  const loadComments = useCallback(async () => {
    try {
      const res  = await fetch(`/api/comments?articleId=${articleId}`)
      const data = await res.json() as { comments: Comment[] }
      setComments(data.comments || [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [articleId])

  useEffect(() => { loadComments() }, [loadComments])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cfToken) { setError('Please complete the verification.'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/comments', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, articleId, cfToken }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (data.ok) {
        setSubmitted(true)
        setForm({ authorName: '', authorEmail: '', body: '' })
      } else {
        setError(data.error || 'Something went wrong.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-10 border-t border-[#2A2A2A] pt-8">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (typeof window !== 'undefined') {
            const w = window as unknown as { turnstile?: { render: (id: string, opts: object) => void } }
            if (w.turnstile) {
              w.turnstile.render('#cf-turnstile', {
                sitekey:  TURNSTILE_SITE_KEY,
                callback: (token: string) => setCfToken(token),
                theme:    'dark',
              })
            }
          }
        }}
      />

      <h3 className="text-sm font-black uppercase tracking-widest text-white border-l-2 border-[#C8102E] pl-3 mb-6 flex items-center gap-2">
        <MessageSquare size={14} />
        Discussion
        {!loading && comments.length > 0 && (
          <span className="text-[#6B7280] font-normal normal-case tracking-normal">
            ({comments.length})
          </span>
        )}
      </h3>

      {/* Comments list */}
      {loading ? (
        <div className="flex items-center gap-2 text-[#6B7280] text-sm py-4">
          <Loader2 size={14} className="animate-spin" /> Loading comments...
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4 mb-8">
          {comments.map(c => (
            <div key={c.id} className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#C8102E] flex items-center justify-center text-white font-bold text-xs">
                  {c.authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{c.authorName}</p>
                  <p className="text-[11px] text-[#6B7280]">{formatRelative(c.createdAt!)}</p>
                </div>
              </div>
              <p className="text-sm text-[#D1D5DB] leading-relaxed pl-11">{c.body}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#6B7280] mb-8">No comments yet. Be the first to comment.</p>
      )}

      {/* Comment form */}
      {submitted ? (
        <div className="bg-[#161616] border border-[#007A3D] rounded-xl p-5 text-center">
          <p className="text-[#007A3D] font-semibold text-sm">✓ Comment submitted</p>
          <p className="text-[#6B7280] text-xs mt-1">Your comment is under review and will appear shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-[#6B7280]">Leave a comment</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1.5">Name *</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={form.authorName}
                onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-[#C8102E] transition-colors"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1.5">Email * (not published)</label>
              <input
                type="email"
                required
                value={form.authorEmail}
                onChange={e => setForm(f => ({ ...f, authorEmail: e.target.value }))}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-[#C8102E] transition-colors"
                placeholder="your@email.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1.5">Comment *</label>
            <textarea
              required
              minLength={3}
              maxLength={2000}
              rows={4}
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-[#C8102E] transition-colors resize-none"
              placeholder="Share your thoughts..."
            />
            <p className="text-[11px] text-[#4B5563] mt-1 text-right">{form.body.length}/2000</p>
          </div>

          {/* Cloudflare Turnstile */}
          <div id="cf-turnstile" className="my-2" />

          {error && (
            <p className="text-xs text-[#C8102E] bg-[#C8102E]/10 border border-[#C8102E]/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-[#C8102E] text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#8B0000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {submitting ? 'Submitting...' : 'Post Comment'}
          </button>
        </form>
      )}
    </section>
  )
}
