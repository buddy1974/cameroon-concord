'use client'
import { useState } from 'react'

export function NewsletterCTA() {
  const [email,  setEmail]  = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function subscribe() {
    if (!email.includes('@')) return
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section style={{
      background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-surface))',
      border: '1px solid var(--border)',
      borderRadius: '20px',
      padding: 'clamp(32px, 5vw, 60px) clamp(24px, 5vw, 40px)',
      textAlign: 'center',
      margin: '60px 0',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow blob */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, hsla(354,78%,50%,0.08), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--brand)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
          Free Newsletter
        </div>
        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.2 }}>
          Cameroon&apos;s Story, In Your Inbox
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 32px', lineHeight: 1.6 }}>
          Join thousands of readers getting the most important Cameroon stories every week. No spam. Unsubscribe anytime.
        </p>

        {status === 'done' ? (
          <div style={{ color: '#22C55E', fontWeight: 700, fontSize: '1rem' }}>✓ You&apos;re subscribed. Welcome to CC.</div>
        ) : status === 'error' ? (
          <div style={{ color: 'var(--brand)', fontWeight: 600 }}>Something went wrong — please try again.</div>
        ) : (
          <div style={{ display: 'flex', gap: '12px', maxWidth: '420px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && subscribe()}
              placeholder="your@email.com"
              style={{
                flex: '1 1 200px',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '14px 16px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            <button
              onClick={subscribe}
              disabled={status === 'loading'}
              style={{
                background: 'var(--brand)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '14px 24px',
                fontWeight: 700,
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                fontSize: '0.85rem',
                opacity: status === 'loading' ? 0.7 : 1,
              }}
            >
              {status === 'loading' ? '...' : 'Subscribe Free'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
