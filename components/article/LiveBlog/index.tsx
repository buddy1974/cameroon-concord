'use client'
import { useEffect, useState } from 'react'

interface LiveUpdate {
  id: number
  content: string
  label: string | null
  createdAt: string
}

interface Props {
  articleId: number
  isLive: number | null
  liveEnded: number | null
}

export function LiveBlog({ articleId, isLive, liveEnded }: Props) {
  const [updates, setUpdates] = useState<LiveUpdate[]>([])

  async function fetchUpdates() {
    try {
      const res = await fetch(`/api/live-updates/${articleId}`, { cache: 'no-store' })
      if (res.ok) setUpdates(await res.json() as LiveUpdate[])
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchUpdates()
    if (isLive && !liveEnded) {
      const interval = setInterval(fetchUpdates, 30000)
      return () => clearInterval(interval)
    }
  }, [articleId, isLive, liveEnded])

  if (!isLive && updates.length === 0) return null

  const active = isLive && !liveEnded

  return (
    <div style={{ margin: '24px 0', border: '1px solid #C8102E', borderRadius: '10px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: '#C8102E', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {active && (
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'livePulse 1.2s ease-in-out infinite' }} />
        )}
        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          {active ? 'Live Blog' : 'Live Blog — Ended'}
        </span>
        {active && (
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.7)', marginLeft: 'auto' }}>
            Updates every 30s
          </span>
        )}
      </div>

      {/* Updates */}
      <div style={{ background: '#0A0A0A', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {updates.length === 0 && (
          <p style={{ fontSize: '0.8rem', color: '#555', textAlign: 'center', padding: '16px 0' }}>
            No updates yet. Check back soon.
          </p>
        )}
        {updates.map(u => (
          <div key={u.id} style={{ borderLeft: '2px solid #C8102E', paddingLeft: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.6rem', color: '#555' }}>
                {new Date(u.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                {' · '}
                {new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
              {u.label && (
                <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#F5A623', background: '#F5A62318', padding: '1px 7px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {u.label}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.88rem', color: '#CCC', lineHeight: 1.65, margin: 0 }}>{u.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
