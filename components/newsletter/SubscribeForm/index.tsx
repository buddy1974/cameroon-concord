'use client'
import { useState } from 'react'

export default function SubscribeForm({ source }: { source?: string }) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    setMsg('')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
      const data = await res.json()
      if (data.success) {
        setDone(true)
        setMsg('You\'re subscribed! Stay tuned for the latest Cameroon news.')
      } else {
        setMsg(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setMsg('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <div style={{ background: '#0f0f0f', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '20px' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#C8102E', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>
        Newsletter
      </div>
      <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: '14px', lineHeight: 1.5 }}>
        Get the latest Cameroon news delivered to your inbox.
      </p>
      {done ? (
        <div style={{ background: '#0a2a0a', border: '1px solid #007A3D', borderRadius: '6px', padding: '10px 14px', color: '#4ade80', fontSize: '0.82rem' }}>
          {msg}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{
              width: '100%', background: '#080808', border: '1px solid #2A2A2A',
              borderRadius: '8px', padding: '9px 12px', color: '#EEE',
              fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', marginBottom: '8px',
            }}
          />
          {msg && (
            <div style={{ fontSize: '0.75rem', color: '#C8102E', marginBottom: '8px' }}>{msg}</div>
          )}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', background: '#C8102E', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '9px', fontSize: '0.8rem', fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Subscribing...' : 'Subscribe Free'}
          </button>
        </form>
      )}
    </div>
  )
}
