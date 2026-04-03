'use client'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import type { ArticleWithRelations } from '@/lib/types'

export function BreakingBanner({ articles }: { articles: ArticleWithRelations[] }) {
  if (!articles.length) return null
  const items = [...articles, ...articles, ...articles]
  return (
    <div className="bg-[#C8102E] h-8 flex items-center overflow-hidden">
      <div className="flex-shrink-0 flex items-center gap-1.5 px-4 bg-[#8B0000] h-full z-10">
        <Zap size={11} fill="white" className="text-white" />
        <span className="text-[0.58rem] font-black uppercase tracking-[0.18em] text-white whitespace-nowrap">Breaking</span>
      </div>
      <div className="overflow-hidden flex-1 relative min-w-0">
        <div className="ticker flex items-center whitespace-nowrap gap-0">
          {items.map((a, i) => (
            <Link key={`${a.id}-${i}`} href={`/${a.category.slug}/${a.slug}`}
              className="inline-flex items-center gap-2 px-6 text-[0.68rem] font-semibold text-white/90 hover:text-white transition-colors whitespace-nowrap">
              <span className="w-1 h-1 rounded-full bg-white/40" />
              {a.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
