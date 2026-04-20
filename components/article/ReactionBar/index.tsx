'use client'
import { useEffect, useState } from 'react'

const REACTIONS = [
  { emoji: '🔥', label: 'Hot' },
  { emoji: '😡', label: 'Outraged' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '👏', label: 'Important' },
  { emoji: '🤔', label: 'Suspicious' },
  { emoji: '😮', label: 'Shocking' },
]

export function ReactionBar({ articleId }: { articleId: number }) {
  const [counts,   setCounts]   = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(`reaction_${articleId}`)
    if (stored) setSelected(stored)
    fetch(`/api/reactions/${articleId}`)
      .then(r => r.json())
      .then((rows: { reaction: string; count: number }[]) => {
        const map: Record<string, number> = {}
        rows.forEach(r => { map[r.reaction] = Number(r.count) })
        setCounts(map)
        setLoading(false)
      })
  }, [articleId])

  async function handleReact(emoji: string) {
    if (selected) return
    setSelected(emoji)
    localStorage.setItem(`reaction_${articleId}`, emoji)
    setCounts(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }))
    await fetch(`/api/reactions/${articleId}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ reaction: emoji }),
    })
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div style={{ margin: '32px 0', padding: '20px', background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '12px' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
        How does this story make you feel?
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {REACTIONS.map(({ emoji, label }) => {
          const count      = counts[emoji] || 0
          const pct        = total > 0 ? Math.round((count / total) * 100) : 0
          const isSelected = selected === emoji
          const isDisabled = selected !== null && !isSelected
          return (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              disabled={!!selected}
              title={label}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '4px', padding: '10px 14px', borderRadius: '10px',
                border:     isSelected ? '1px solid #C8102E' : '1px solid #1A1A1A',
                background: isSelected ? '#1A0505' : '#161616',
                cursor:     selected ? 'default' : 'pointer',
                opacity:    isDisabled ? 0.4 : 1,
                transition: 'all 0.2s', minWidth: '56px',
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
              {!loading && (
                <span style={{ fontSize: '0.65rem', color: isSelected ? '#C8102E' : '#555', fontWeight: 600 }}>
                  {pct > 0 ? `${pct}%` : ''}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {total > 0 && (
        <div style={{ marginTop: '10px', fontSize: '0.68rem', color: '#444' }}>
          {total.toLocaleString()} reader{total !== 1 ? 's' : ''} reacted
        </div>
      )}
    </div>
  )
}
