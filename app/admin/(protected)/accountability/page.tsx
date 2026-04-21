'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Promise_ {
  id: number; official: string; ministry: string | null; promise: string
  dateMade: string; deadline: string | null; status: string | null
  evidenceUrl: string | null; notes: string | null
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#F5A623', kept: '#22C55E', broken: '#C8102E', partial: '#A855F7',
}

const STATUSES = ['pending', 'kept', 'broken', 'partial'] as const

const BLANK = { official: '', ministry: '', promise: '', dateMade: '', deadline: '', evidenceUrl: '', notes: '' }

export default function AdminAccountabilityPage() {
  const [promises, setPromises] = useState<Promise_[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    const res = await fetch('/api/accountability')
    if (res.ok) setPromises(await res.json() as Promise_[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/admin/accountability/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setPromises(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  async function deletePromise(id: number) {
    if (!confirm('Delete this promise?')) return
    await fetch(`/api/admin/accountability/${id}`, { method: 'DELETE' })
    setPromises(prev => prev.filter(p => p.id !== id))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.official || !form.promise || !form.dateMade) { setMsg('Fill required fields'); return }
    setSaving(true)
    const res = await fetch('/api/admin/accountability', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) { setShowAdd(false); setForm(BLANK); setMsg(''); await load() }
    else setMsg('Save failed')
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#080808', border: '1px solid #2A2A2A', borderRadius: '6px',
    padding: '8px 10px', color: '#EEE', fontSize: '0.82rem', outline: 'none',
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F0F0F0' }}>Accountability Tracker</h1>
          <p style={{ fontSize: '0.78rem', color: '#555', marginTop: '4px' }}>{promises.length} promises on record</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowAdd(s => !s)} style={{ background: '#C8102E', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
            + Add Promise
          </button>
          <Link href="/accountability" target="_blank" style={{ fontSize: '0.72rem', color: '#F5A623', background: '#1A1A1A', border: '1px solid #2A2A2A', padding: '8px 14px', borderRadius: '8px', textDecoration: 'none' }}>
            View Public →
          </Link>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} style={{ background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: '10px', padding: '20px', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ gridColumn: '1/-1', fontSize: '0.65rem', fontWeight: 800, color: '#C8102E', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>New Promise</div>
          {([
            ['Official *', 'official', 'text'],
            ['Ministry', 'ministry', 'text'],
            ['Date Made *', 'dateMade', 'date'],
            ['Deadline', 'deadline', 'date'],
            ['Evidence URL', 'evidenceUrl', 'url'],
          ] as [string, keyof typeof BLANK, string][]).map(([label, key, type]) => (
            <div key={key}>
              <div style={{ fontSize: '0.6rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{label}</div>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputStyle} />
            </div>
          ))}
          <div style={{ gridColumn: '1/-1' }}>
            <div style={{ fontSize: '0.6rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Promise *</div>
            <textarea value={form.promise} onChange={e => setForm(f => ({ ...f, promise: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <div style={{ fontSize: '0.6rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Notes</div>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ gridColumn: '1/-1', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button type="submit" disabled={saving} style={{ background: '#C8102E', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving...' : 'Save Promise'}
            </button>
            <button type="button" onClick={() => { setShowAdd(false); setMsg('') }} style={{ background: 'transparent', border: '1px solid #333', color: '#888', padding: '8px 14px', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer' }}>
              Cancel
            </button>
            {msg && <span style={{ fontSize: '0.75rem', color: '#C8102E' }}>{msg}</span>}
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ color: '#555', fontSize: '0.8rem' }}>Loading...</p>
      ) : (
        <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '10px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1A1A1A' }}>
                {['Official', 'Ministry', 'Promise', 'Date Made', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.6rem', fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promises.map((p, i) => {
                const color = STATUS_COLORS[p.status ?? 'pending'] ?? '#F5A623'
                return (
                  <tr key={p.id} style={{ borderBottom: i < promises.length - 1 ? '1px solid #141414' : 'none' }}>
                    <td style={{ padding: '14px 16px', color: '#E0E0E0', fontWeight: 600, whiteSpace: 'nowrap' }}>{p.official}</td>
                    <td style={{ padding: '14px 16px', color: '#555', whiteSpace: 'nowrap' }}>{p.ministry ?? '—'}</td>
                    <td style={{ padding: '14px 16px', color: '#AAA', maxWidth: '280px' }}>{p.promise}</td>
                    <td style={{ padding: '14px 16px', color: '#555', whiteSpace: 'nowrap' }}>
                      {new Date(p.dateMade).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={p.status ?? 'pending'}
                        onChange={e => updateStatus(p.id, e.target.value)}
                        style={{ background: `${color}18`, border: `1px solid ${color}40`, color, borderRadius: '20px', padding: '3px 8px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', outline: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <button onClick={() => deletePromise(p.id)} style={{ background: 'transparent', border: '1px solid #C8102E', color: '#C8102E', padding: '3px 10px', borderRadius: '6px', fontSize: '0.62rem', cursor: 'pointer', fontWeight: 700 }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
              {promises.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '24px', color: '#555', textAlign: 'center' }}>No promises yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
