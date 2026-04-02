'use client'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import type { ArticleWithRelations } from '@/lib/types'

interface Props { articles: ArticleWithRelations[] }

export function BreakingBanner({ articles }: Props) {
  if (!articles.length) return null
  return (
    <div className="bg-[#C8102E] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-9">
        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest whitespace-nowrap pr-4 border-r border-white/30 mr-4">
          <Zap size={12} fill="currentColor" />
          Breaking
        </span>
        <div className="overflow-hidden flex-1 relative">
          <div className="ticker-content flex items-center gap-8 whitespace-nowrap">
            {[...articles, ...articles].map((a, i) => (
              <Link
                key={`${a.id}-${i}`}
                href={`/${a.category.slug}/${a.slug}`}
                className="text-xs font-medium hover:underline whitespace-nowrap"
              >
                {a.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
