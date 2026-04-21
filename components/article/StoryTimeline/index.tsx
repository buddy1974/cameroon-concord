'use client'
import { useEffect, useState } from 'react'

interface Story {
  id: number
  title: string
  slug: string
  publishedAt: string
  category: { name: string; slug: string }
}

export function StoryTimeline({ articleId }: { articleId: number }) {
  const [stories, setStories] = useState<Story[]>([])
  const [loaded, setLoaded]   = useState(false)

  useEffect(() => {
    fetch(`/api/articles/timeline/${articleId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setStories(data)
        setLoaded(true)
      })
  }, [articleId])

  if (!loaded || stories.length === 0) return null

  return (
    <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '12px', overflow: 'hidden', margin: '32px 0' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1A1A1A' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#F5A623', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          📅 Story Timeline · {stories.length} articles
        </div>
      </div>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {stories.map((s, i) => {
          const isCurrent = s.id === articleId
          const date = s.publishedAt
            ? new Date(s.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : ''
          return (
            <a
              key={s.id}
              href={`/${s.category.slug}/${s.slug}`}
              style={{
                display: 'flex', gap: '12px', padding: '10px 16px',
                borderBottom: i < stories.length - 1 ? '1px solid #141414' : 'none',
                textDecoration: 'none',
                background: isCurrent ? '#161616' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              {/* Timeline dot + line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isCurrent ? '#C8102E' : '#2A2A2A', border: isCurrent ? '2px solid #C8102E' : '2px solid #333', flexShrink: 0 }} />
                {i < stories.length - 1 && (
                  <div style={{ width: '1px', flex: 1, background: '#1E1E1E', marginTop: '4px' }} />
                )}
              </div>
              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.62rem', color: '#444', marginBottom: '3px' }}>{date}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#EEE' : '#888', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '0.58rem', color: '#C8102E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px' }}>
                  {s.category.name}
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
