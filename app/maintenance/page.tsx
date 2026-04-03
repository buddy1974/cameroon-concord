'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MaintenancePage() {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/maintenance-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await res.json() as { ok?: boolean; error?: string }
    if (data.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError('Wrong password')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>
          <span style={{ color: '#fff' }}>Cameroon</span>
          <span style={{ color: '#C8102E' }}>Concord</span>
        </div>
        <p style={{ color: '#444', fontSize: '0.75rem', marginTop: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Cameroon &amp; Southern Cameroons News
        </p>
      </div>

      <div style={{
        background: '#101010',
        border: '1px solid #1E1E1E',
        borderRadius: '16px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '420px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '56px', height: '56px',
            background: '#1A1A1A',
            border: '1px solid #2A2A2A',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '1.5rem',
          }}>
            🔧
          </div>
          <h1 style={{ color: '#EEE', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
            Under Construction
          </h1>
          <p style={{ color: '#555', fontSize: '0.8rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
            We are rebuilding Cameroon Concord with a completely new platform. Back very soon.
          </p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          {[
            { label: 'New platform',               done: true  },
            { label: '17,722 articles migrated',   done: true  },
            { label: 'Design & performance',       done: false },
            { label: 'Launch',                     done: false },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 0',
              borderBottom: '1px solid #1A1A1A',
            }}>
              <span style={{
                width: '18px', height: '18px',
                borderRadius: '50%',
                background: item.done ? '#007A3D' : '#1A1A1A',
                border: `1px solid ${item.done ? '#007A3D' : '#2A2A2A'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px',
                flexShrink: 0,
                color: '#fff',
              }}>
                {item.done ? '✓' : ''}
              </span>
              <span style={{ color: item.done ? '#EEE' : '#444', fontSize: '0.78rem' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', color: '#555', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Staff Access
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter access code"
            style={{
              width: '100%',
              background: '#080808',
              border: '1px solid #2A2A2A',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#EEE',
              fontSize: '0.9rem',
              outline: 'none',
              marginBottom: '10px',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <p style={{ color: '#C8102E', fontSize: '0.75rem', marginBottom: '8px' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#C8102E',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '11px',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Checking...' : 'Access Site →'}
          </button>
        </form>
      </div>

      <p style={{ color: '#222', fontSize: '0.65rem', marginTop: '2rem', textAlign: 'center' }}>
        © 2026 Cameroon Concord. All Rights Reserved.
      </p>
    </div>
  )
}
