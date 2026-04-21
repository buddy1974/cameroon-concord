'use client'
import { useEffect, useState } from 'react'
import { ArticleCard } from '@/components/article/ArticleCard'

export default function MyFeedPage() {
  const [articles, setArticles] = useState<any[]>([])
  const [topics, setTopics]     = useState<string[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const followed: string[] = JSON.parse(localStorage.getItem('cc_followed_topics') || '[]')
    setTopics(followed)
    if (followed.length === 0) { setLoading(false); return }
    fetch(`/api/feed?topics=${followed.join(',')}`)
      .then(r => r.json())
      .then(data => { setArticles(data); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ padding: '40px', color: '#555', textAlign: 'center' }}>Loading your feed...</div>
  )

  if (topics.length === 0) return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📰</div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F0F0F0', marginBottom: '8px' }}>Your Feed is Empty</h1>
      <p style={{ fontSize: '0.9rem', color: '#555' }}>Follow topics on any category or article page to build your personalised feed.</p>
    </div>
  )

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#F5A623', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>Your Feed</div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F0F0F0', marginBottom: '4px' }}>Topics You Follow</h1>
      <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '32px' }}>Following: {topics.join(', ')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {articles.map((a: any) => <ArticleCard key={a.id} article={a} />)}
      </div>
      {articles.length === 0 && <p style={{ color: '#555', textAlign: 'center' }}>No recent articles for your followed topics.</p>}
    </div>
  )
}
