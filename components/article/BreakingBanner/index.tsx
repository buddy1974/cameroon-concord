'use client'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import type { ArticleWithRelations } from '@/lib/types'

interface Props { articles: ArticleWithRelations[] }

export function BreakingBanner({ articles }: Props) {
  if (!articles.length) return null
  const doubled = [...articles, ...articles]
  return (
    <div className="bg-[#C8102E] overflow-hidden h-8 flex items-center">
      <div className="flex-shrink-0 flex items-center gap-1.5 px-4 bg-[#8B0000] h-full">
        <Zap size={11} fill="white" className="text-white" />
        <span className="text-[0.6rem] font-black uppercase tracking-[0.15em] text-white whitespace-nowrap">
          Breaking
        </span>
      </div>
      <div className="overflow-hidden flex-1 relative">
        <div className="ticker-track flex items-center whitespace-nowrap">
          {doubled.map((a, i) => (
            <Link
              key={`${a.id}-${i}`}
              href={`/${a.category.slug}/${a.slug}`}
              className="inline-flex items-center text-[0.7rem] font-semibold text-white/90 hover:text-white px-6 transition-colors whitespace-nowrap">
              <span className="w-1 h-1 rounded-full bg-white/40 mr-3 flex-shrink-0" />
              {a.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
