'use client'
import { useState, useCallback } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { ArticleCard } from '@/components/article/ArticleCard'
import type { ArticleWithRelations } from '@/lib/types'

export default function SearchPage() {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState<ArticleWithRelations[]>([])
  const [loading,  setLoading]  = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) return
    setLoading(true)
    setSearched(true)
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json() as { articles: ArticleWithRelations[] }
      setResults(data.articles || [])
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch(query)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-white mb-6">Search Articles</h1>

      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #C8102E', marginBottom: '2rem', background: 'transparent' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search Cameroon news..."
            autoFocus
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '1.1rem',
              padding: '12px 0',
              caretColor: '#C8102E',
            }}
          />
        </div>
        <button
          onClick={() => handleSearch(query)}
          disabled={loading}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            color: '#C8102E',
            flexShrink: 0,
          }}
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={22} />}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-[#6B7280] text-sm">
          <Loader2 size={14} className="animate-spin" /> Searching...
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="text-[#6B7280] text-sm">No results found for &quot;{query}&quot;.</p>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="text-xs text-[#6B7280] mb-4">{results.length} results for &quot;{query}&quot;</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.map(a => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
