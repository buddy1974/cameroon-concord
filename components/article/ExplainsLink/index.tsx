interface Props {
  topicId: string
  label:   string
}

export function ExplainsLink({ topicId, label }: Props) {
  return (
    <a
      href={`/explains/${topicId}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        fontSize: '0.72rem', color: '#F5A623', textDecoration: 'none',
        background: '#0F0F0F', border: '1px solid #F5A623',
        borderRadius: '4px', padding: '2px 8px', margin: '0 4px',
      }}
    >
      📖 {label}
    </a>
  )
}
