'use client'
import { useEffect, useState } from 'react'

interface Props {
  articleId: number
  inline?: boolean
}

export function HeatScore({ articleId, inline = false }: Props) {
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/articles/heat/${articleId}`)
      .then(r => r.json())
      .then(d => { if (d.score > 1) setScore(d.score) })
  }, [articleId])

  if (score === null) return null

  const color = score >= 8 ? '#C8102E' : score >= 5 ? '#F5A623' : '#555'
  const label = score >= 8 ? 'Trending' : score >= 5 ? 'Popular' : 'Rising'

  if (inline) {
    return (
      <span style={{ fontSize: '0.65rem', fontWeight: 700, color, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
        🔥 {score} · {label}
      </span>
    )
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: `${color}15`, border: `1px solid ${color}40`, borderRadius: '20px' }}>
      <span style={{ fontSize: '0.9rem' }}>🔥</span>
      <span style={{ fontSize: '0.7rem', fontWeight: 800, color }}>{score}</span>
      <span style={{ fontSize: '0.65rem', color: '#555' }}>{label}</span>
    </div>
  )
}
