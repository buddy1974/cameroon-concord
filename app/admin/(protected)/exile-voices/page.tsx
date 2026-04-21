'use client'
import { useEffect, useState } from 'react'

interface Submission {
  id: number; content: string; region: string | null; category: string | null
  status: string | null; createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#F5A623', reviewing: '#3B82F6', published: '#22C55E', rejected: '#555',
}

const STATUSES = ['pending', 'reviewing', 'published', 'rejected'] as const

export default function ExileVoicesAdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/exile-voices')
      .then(r => r.json())
      .then(d => { setSubmissions(d as Submission[]); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/admin/exile-voices/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
  }

  async function deleteSubmission(id: number) {
    if (!confirm('Delete this submission?')) return
    await fetch(`/api/admin/exile-voices/${id}`, { method: 'DELETE' })
    setSubmissions(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F0F0F0', marginBottom: '8px' }}>Exile Voices</h1>
      <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '24px' }}>{submissions.length} submissions</p>

      {loading ? (
        <p style={{ color: '#555' }}>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {submissions.map(s => {
            const color = STATUS_COLORS[s.status ?? 'pending'] ?? '#F5A623'
            return (
              <div key={s.id} style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {s.region && <span style={{ fontSize: '0.65rem', color: '#777' }}>{s.region}</span>}
                    {s.category && <span style={{ fontSize: '0.65rem', color: '#555' }}>· {s.category}</span>}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#444' }}>
                    {new Date(s.createdAt).toLocaleString('en-GB')}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#C0C0C0', lineHeight: 1.6, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>
                  {s.content}
                </p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {STATUSES.map(status => (
                    <button
                      key={status}
                      onClick={() => updateStatus(s.id, status)}
                      style={{
                        padding: '4px 12px', borderRadius: '20px', fontSize: '0.62rem', fontWeight: 800,
                        textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
                        border: `1px solid ${s.status === status ? STATUS_COLORS[status] : '#2A2A2A'}`,
                        background: s.status === status ? `${STATUS_COLORS[status]}20` : 'transparent',
                        color: s.status === status ? STATUS_COLORS[status] : '#555',
                      }}
                    >
                      {status}
                    </button>
                  ))}
                  <button
                    onClick={() => deleteSubmission(s.id)}
                    style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: '6px', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer', border: '1px solid #C8102E', background: 'transparent', color: '#C8102E' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
          {submissions.length === 0 && <p style={{ color: '#555' }}>No submissions yet.</p>}
        </div>
      )}
    </div>
  )
}
