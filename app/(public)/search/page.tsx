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

      <div className="flex gap-3 mb-8">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search Cameroon news..."
            className="w-full min-w-0 bg-[#161616] border border-[#2A2A2A] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-[#C8102E] transition-colors"
            autoFocus
          />
        </div>
        <button
          onClick={() => handleSearch(query)}
          disabled={loading}
          className="bg-[#C8102E] text-white font-semibold px-5 py-3 rounded-xl hover:bg-[#8B0000] disabled:opacity-50 transition-colors text-sm flex-shrink-0 whitespace-nowrap"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
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
