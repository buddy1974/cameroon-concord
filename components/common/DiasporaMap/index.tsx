'use client'
import { useEffect, useState } from 'react'

interface CountryData {
  countryCode: string
  countryName: string
  visitCount: number
}

export function DiasporaMap() {
  const [data, setData]     = useState<CountryData[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/geo/track', { method: 'POST' }).catch(() => {})
    fetch('/api/geo/track')
      .then(r => r.json())
      .then(d => { setData(d); setLoaded(true) })
  }, [])

  if (!loaded || data.length === 0) return null

  const max = Math.max(...data.map(d => d.visitCount))

  return (
    <div style={{ marginTop: '40px' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#F5A623', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
        🌍 CC Readers Around the World
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {data.slice(0, 15).map(c => {
          const pct        = Math.round((c.visitCount / max) * 100)
          const isCameroon = c.countryCode === 'CM'
          return (
            <div key={c.countryCode} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '0.72rem', color: isCameroon ? '#F5A623' : '#888', width: '140px', flexShrink: 0, fontWeight: isCameroon ? 700 : 400 }}>
                {c.countryName}
              </div>
              <div style={{ flex: 1, background: '#1A1A1A', borderRadius: '3px', height: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: isCameroon ? '#F5A623' : '#C8102E', borderRadius: '3px', transition: 'width 0.5s' }} />
              </div>
              <div style={{ fontSize: '0.65rem', color: '#444', width: '40px', textAlign: 'right', flexShrink: 0 }}>
                {c.visitCount.toLocaleString()}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: '0.62rem', color: '#333', marginTop: '12px' }}>
        No personal data collected — country only, aggregated.
      </div>
    </div>
  )
}
