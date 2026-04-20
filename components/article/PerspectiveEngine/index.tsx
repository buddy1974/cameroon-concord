'use client'
import { useState } from 'react'

interface Perspectives {
  regime: string
  opposition: string
  independent: string
}

const VIEWS = [
  { key: 'regime',      label: 'Regime View',      color: '#C8102E', icon: '🏛️' },
  { key: 'opposition',  label: 'Opposition View',   color: '#22C55E', icon: '✊' },
  { key: 'independent', label: 'Independent View',  color: '#F5A623', icon: '🔍' },
] as const

const POLITICAL_CATEGORIES = ['politics', 'headlines', 'southern-cameroons', 'inside-cpdm']

export function PerspectiveEngine({ articleId, categorySlug }: { articleId: number; categorySlug: string }) {
  const [data, setData]       = useState<Perspectives | null>(null)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded]   = useState(false)
  const [active, setActive]   = useState<'regime' | 'opposition' | 'independent'>('independent')

  if (!POLITICAL_CATEGORIES.includes(categorySlug)) return null

  async function load() {
    if (loaded) return
    setLoading(true)
    try {
      const res  = await fetch(`/api/articles/perspectives/${articleId}`)
      const json = await res.json()
      setData(json)
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ margin: '32px 0', background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #1A1A1A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#F5A623', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          🔭 3 Perspectives
        </div>
        {!loaded && (
          <button
            onClick={load}
            disabled={loading}
            style={{ fontSize: '0.7rem', color: '#555', background: 'none', border: '1px solid #1A1A1A', borderRadius: '6px', padding: '4px 10px', cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Loading...' : 'Show perspectives'}
          </button>
        )}
      </div>

      {loaded && data && (
        <>
          <div style={{ display: 'flex', borderBottom: '1px solid #1A1A1A' }}>
            {VIEWS.map(v => (
              <button
                key={v.key}
                onClick={() => setActive(v.key)}
                style={{
                  flex: 1, padding: '10px 4px',
                  fontSize: '0.65rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  border: 'none', cursor: 'pointer',
                  borderBottom: active === v.key ? `2px solid ${v.color}` : '2px solid transparent',
                  background: 'transparent',
                  color: active === v.key ? v.color : '#444',
                  transition: 'all 0.2s',
                }}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>
          <div style={{ padding: '16px', fontSize: '0.88rem', color: '#C0C0C0', lineHeight: 1.7 }}>
            {data[active]}
          </div>
        </>
      )}
    </div>
  )
}
