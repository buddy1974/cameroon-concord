'use client'
import { useState } from 'react'

interface Story {
  id:            number
  title:         string
  slug:          string
  publishedAt:   string
  featuredImage: string | null
  category:      { name: string; slug: string }
}

export function FollowUpStories({ articleId }: { articleId: number }) {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded,  setLoaded]  = useState(false)
  const [none,    setNone]    = useState(false)

  async function load() {
    if (loaded) return
    setLoading(true)
    try {
      const res  = await fetch(`/api/articles/follow-up/${articleId}`)
      const data = await res.json() as Story[]
      if (data.length === 0) setNone(true)
      else setStories(data)
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ margin: '24px 0' }}>
      {!loaded && (
        <button
          onClick={load}
          disabled={loading}
          style={{
            width: '100%', padding: '12px', background: '#0F0F0F',
            border: '1px solid #1A1A1A', borderRadius: '10px',
            color: '#F5A623', fontSize: '0.82rem', fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer', textAlign: 'center',
          }}
        >
          {loading ? 'Searching...' : '🔍 What happened next?'}
        </button>
      )}

      {none && (
        <div style={{ fontSize: '0.75rem', color: '#444', textAlign: 'center', padding: '8px' }}>
          No follow-up stories found yet.
        </div>
      )}

      {stories.length > 0 && (
        <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#F5A623', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '12px 16px', borderBottom: '1px solid #1A1A1A' }}>
            🔍 What happened next
          </div>
          {stories.map(s => (
            <a key={s.id} href={`/${s.category.slug}/${s.slug}`}
              style={{ display: 'flex', gap: '12px', padding: '12px 16px', textDecoration: 'none', borderBottom: '1px solid #111' }}>
              {s.featuredImage && (
                <img src={s.featuredImage} alt={s.title} width={64} height={44}
                  style={{ borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#E0E0E0', lineHeight: 1.4, marginBottom: '3px' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#555' }}>
                  {new Date(s.publishedAt).toLocaleDateString()}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
