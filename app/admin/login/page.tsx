'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res  = await fetch('/api/admin/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password }),
    })
    const data = await res.json() as { ok?: boolean; error?: string }
    if (data.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      setError(data.error || 'Invalid credentials')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#050505',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#0F0F0F', border: '1px solid #1E1E1E',
        borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '380px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
            Cameroon<span style={{ color: '#C8102E' }}>Concord</span>
          </div>
          <p style={{ color: '#444', fontSize: '0.75rem', marginTop: '4px' }}>Admin Access</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              required
              style={{ width: '100%', background: '#080808', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '10px 12px', color: '#EEE', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%', background: '#080808', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '10px 12px', color: '#EEE', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {error && (
            <p style={{ color: '#C8102E', fontSize: '0.75rem', marginBottom: '12px' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: '#C8102E', color: '#fff',
              border: 'none', borderRadius: '8px', padding: '11px',
              fontSize: '0.82rem', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>
      </div>
    </div>
  )
}
