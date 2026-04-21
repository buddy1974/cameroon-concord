import { ENTITY_TOOLTIPS } from '@/lib/entity-tooltips'

interface Props {
  body: string
}

export function EntityReference({ body }: Props) {
  const mentioned = Object.entries(ENTITY_TOOLTIPS).filter(([entity]) =>
    body.toLowerCase().includes(entity.toLowerCase())
  )

  if (mentioned.length === 0) return null

  return (
    <div style={{ margin: '32px 0', background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '12px', padding: '20px' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#F5A623', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
        📖 Key Terms in This Article
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {mentioned.map(([entity, definition]) => (
          <div key={entity} style={{ display: 'flex', gap: '10px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#E0E0E0', minWidth: '120px', flexShrink: 0 }}>
              {entity}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#777', lineHeight: 1.5 }}>
              {definition}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
