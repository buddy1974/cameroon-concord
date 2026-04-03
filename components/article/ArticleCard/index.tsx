'use client'
import Link from 'next/link'
import { Clock, Eye } from 'lucide-react'
import type { ArticleWithRelations } from '@/lib/types'
import { formatRelative, readingTime, formatHitCount, truncate } from '@/lib/utils'

interface Props {
  article: ArticleWithRelations
  variant?: 'default' | 'hero' | 'featured' | 'compact' | 'horizontal' | 'list'
  priority?: boolean
  index?: number
}

function cleanSrc(url: string | null | undefined): string {
  if (!url) return ''
  return url.split('#')[0].trim()
}

export function ArticleCard({ article, variant = 'default', priority = false, index }: Props) {
  const href = `/${article.category.slug}/${article.slug}`
  const mins = readingTime(article.body)
  const src  = cleanSrc(article.featuredImage)

  /* ── HERO ── */
  if (variant === 'hero') {
    return (
      <Link href={href} className="relative block w-full rounded-2xl overflow-hidden group" style={{ aspectRatio: '21/9', minHeight: '320px', background: '#101010' }}>
        {src && <img src={src} alt={article.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading={priority ? 'eager' : 'lazy'} onError={e => { e.currentTarget.style.display = 'none' }} />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="flex items-center gap-2 mb-3">
            {article.isBreaking && <span className="cat-pill" style={{ background: '#F5A623', color: '#000' }}>⚡ Breaking</span>}
            <span className="cat-pill">{article.category.name}</span>
          </div>
          <h2 className="text-2xl md:text-[2.2rem] lg:text-[2.6rem] font-black text-white leading-[1.1] tracking-[-0.02em] group-hover:text-[#F5A623] transition-colors max-w-4xl">
            {article.title}
          </h2>
          {article.excerpt && (
            <p className="hidden md:block text-[#999] text-sm mt-3 max-w-2xl line-clamp-2">
              {truncate(article.excerpt, 160)}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-[#888]">
            <span>{formatRelative(article.publishedAt!)}</span>
            <span className="flex items-center gap-1"><Clock size={11} />{mins}m</span>
            {article.hits > 100 && <span className="flex items-center gap-1 text-[#F5A623]"><Eye size={11} />{formatHitCount(article.hits)}</span>}
          </div>
        </div>
      </Link>
    )
  }

  /* ── FEATURED ── */
  if (variant === 'featured') {
    return (
      <Link href={href} className="relative block rounded-xl overflow-hidden group card img-zoom" style={{ aspectRatio: '4/3', background: '#101010' }}>
        {src && <img src={src} alt={article.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" onError={e => { e.currentTarget.style.display = 'none' }} />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span className="cat-pill mb-2 block w-fit">{article.category.name}</span>
          <h3 className="text-white font-black text-[0.95rem] leading-snug group-hover:text-[#F5A623] transition-colors line-clamp-3">
            {article.title}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-[0.62rem] text-[#999]">
            <span>{formatRelative(article.publishedAt!)}</span>
            {article.hits > 100 && <span className="text-[#F5A623]">{formatHitCount(article.hits)}</span>}
          </div>
        </div>
      </Link>
    )
  }

  /* ── COMPACT ── */
  if (variant === 'compact') {
    return (
      <Link href={href} className="flex items-start gap-3 group py-2">
        {src && (
          <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-[#181818] img-zoom">
            <img src={src} alt={article.title} className="w-full h-full object-cover" loading="lazy" onError={e => { e.currentTarget.style.display = 'none' }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-[0.77rem] font-semibold text-[#DDD] group-hover:text-[#F5A623] transition-colors leading-snug line-clamp-2">
            {article.title}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-[0.62rem] text-[#888]">
            <span>{formatRelative(article.publishedAt!)}</span>
            {article.hits > 100 && <span className="text-[#F5A623]">{formatHitCount(article.hits)}</span>}
          </div>
        </div>
      </Link>
    )
  }

  /* ── HORIZONTAL ── */
  if (variant === 'horizontal') {
    return (
      <Link href={href} className="flex gap-3 group card py-3 border-b border-[#1E1E1E] last:border-0">
        {src && (
          <div className="w-24 h-[66px] flex-shrink-0 rounded-lg overflow-hidden bg-[#181818] img-zoom">
            <img src={src} alt={article.title} className="w-full h-full object-cover" loading="lazy" onError={e => { e.currentTarget.style.display = 'none' }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="cat-pill mb-1">{article.category.name}</span>
          <h3 className="text-[0.82rem] font-bold text-[#EEE] group-hover:text-[#F5A623] transition-colors leading-snug line-clamp-2 mt-1">
            {article.title}
          </h3>
          <span className="text-[0.62rem] text-[#888] mt-1 block">{formatRelative(article.publishedAt!)}</span>
        </div>
      </Link>
    )
  }

  /* ── LIST (numbered) ── */
  if (variant === 'list') {
    return (
      <Link href={href} className="flex items-start gap-3 group py-3 border-b border-[#1A1A1A] last:border-0">
        <span className="text-[2.2rem] font-black leading-none flex-shrink-0 mt-0.5 select-none" style={{ color: '#1E1E1E', minWidth: '2rem' }}>
          {(index ?? 0) + 1}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-[0.8rem] font-semibold text-[#DDD] group-hover:text-[#F5A623] transition-colors leading-snug line-clamp-2">
            {article.title}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-[0.62rem]">
            <span className="text-[#888]">{formatRelative(article.publishedAt!)}</span>
            {article.hits > 100 && <span className="text-[#F5A623] font-semibold flex items-center gap-0.5"><Eye size={9} />{formatHitCount(article.hits)}</span>}
          </div>
        </div>
        {src && (
          <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-[#181818] img-zoom">
            <img src={src} alt={article.title} className="w-full h-full object-cover" loading="lazy" onError={e => { e.currentTarget.parentElement!.style.display = 'none' }} />
          </div>
        )}
      </Link>
    )
  }

  /* ── DEFAULT CARD ── */
  return (
    <Link href={href} className="flex flex-col rounded-xl overflow-hidden bg-[#101010] border border-[#1E1E1E] group card h-full">
      <div className="relative overflow-hidden img-zoom" style={{ aspectRatio: '16/9', background: '#181818' }}>
        {src
          ? <img src={src} alt={article.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          : <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5" style={{ background: 'linear-gradient(135deg, #120608 0%, #0A0A14 100%)' }}>
              <span className="text-[#C8102E]/20 text-6xl font-black leading-none select-none">{article.category.name.charAt(0)}</span>
              <span className="text-[#2A2A2A] text-[0.55rem] uppercase tracking-[0.2em] font-bold">{article.category.name}</span>
            </div>
        }
        <div className="absolute top-2.5 left-2.5">
          <span className="cat-pill">{article.category.name}</span>
        </div>
        {article.isBreaking && (
          <div className="absolute top-2.5 right-2.5">
            <span className="cat-pill" style={{ background: '#F5A623', color: '#000' }}>⚡</span>
          </div>
        )}
      </div>
      <div className="p-3.5 flex flex-col flex-1">
        <h3 className="text-[0.88rem] font-bold text-[#EEE] group-hover:text-[#F5A623] transition-colors leading-snug line-clamp-3 flex-1">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-[0.72rem] text-[#888] mt-2 line-clamp-2 leading-relaxed">
            {truncate(article.excerpt, 90)}
          </p>
        )}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#1A1A1A]">
          <span className="text-[0.62rem] text-[#888]">{formatRelative(article.publishedAt!)}</span>
          <div className="flex items-center gap-2 text-[0.62rem] text-[#777]">
            <span className="flex items-center gap-0.5"><Clock size={9} />{mins}m</span>
            {article.hits > 100 && (
              <span className="flex items-center gap-0.5 text-[#F5A623] font-semibold">
                <Eye size={9} />{formatHitCount(article.hits)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
