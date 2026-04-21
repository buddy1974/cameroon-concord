interface Props {
  score: number | null
}

export function CCScore({ score }: Props) {
  if (!score || score < 1) return null

  const color = score >= 8 ? '#22C55E' : score >= 6 ? '#F5A623' : score >= 4 ? '#888' : '#C8102E'
  const label = score >= 8 ? 'CC Verified' : score >= 6 ? 'CC Reviewed' : score >= 4 ? 'CC Standard' : 'Developing'

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', background: `${color}15`, border: `1px solid ${color}40`, borderRadius: '20px' }}>
      <span style={{ fontSize: '0.65rem', fontWeight: 800, color, letterSpacing: '0.05em' }}>
        ✓ {label}
      </span>
      <span style={{ fontSize: '0.6rem', color: '#444' }}>{score}/10</span>
    </div>
  )
}
