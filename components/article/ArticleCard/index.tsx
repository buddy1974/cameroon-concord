import Link from 'next/link'
import Image from 'next/image'
import { Clock, Eye } from 'lucide-react'
import type { ArticleWithRelations } from '@/lib/types'
import { formatRelative, readingTime, formatHitCount, truncate } from '@/lib/utils'

interface Props {
  article:  ArticleWithRelations
  variant?: 'default' | 'featured' | 'compact' | 'horizontal'
  priority?: boolean
}

export function ArticleCard({ article, variant = 'default', priority = false }: Props) {
  const href    = `/${article.category.slug}/${article.slug}`
  const minutes = readingTime(article.body)
  const image   = article.featuredImage

  if (variant === 'compact') {
    return (
      <Link href={href} className="flex items-start gap-3 group py-3 border-b border-[#2A2A2A] last:border-0">
        {image && (
          <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-[#1F1F1F]">
            <Image src={image} alt={article.imageAlt || article.title} fill className="object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C8102E]">
            {article.category.name}
          </span>
          <h4 className="text-sm font-semibold text-white group-hover:text-[#F5A623] transition-colors leading-snug mt-0.5 line-clamp-2">
            {article.title}
          </h4>
          <span className="text-[11px] text-[#6B7280] mt-1 block">
            {formatRelative(article.publishedAt!)}
          </span>
        </div>
      </Link>
    )
  }

  if (variant === 'horizontal') {
    return (
      <Link href={href} className="flex gap-4 group card-hover">
        {image && (
          <div className="relative w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-[#1F1F1F]">
            <Image src={image} alt={article.imageAlt || article.title} fill className="object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C8102E]">
            {article.category.name}
          </span>
          <h3 className="text-sm font-semibold text-white group-hover:text-[#F5A623] transition-colors leading-snug mt-1 line-clamp-2">
            {article.title}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-[#6B7280]">
            <span>{formatRelative(article.publishedAt!)}</span>
            <span className="flex items-center gap-1"><Clock size={10} />{minutes}m</span>
            {article.hits > 0 && (
              <span className="flex items-center gap-1"><Eye size={10} />{formatHitCount(article.hits)}</span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link href={href} className="relative block rounded-xl overflow-hidden group aspect-[16/9] bg-[#161616] card-hover">
        {image && (
          <Image
            src={image}
            alt={article.imageAlt || article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={priority}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {article.isBreaking && (
            <span className="inline-flex items-center gap-1 bg-[#C8102E] text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded mb-2">
              Breaking
            </span>
          )}
          <span className="block text-[11px] font-bold uppercase tracking-wider text-[#F5A623] mb-1">
            {article.category.name}
          </span>
          <h2 className="text-white font-bold text-lg leading-snug group-hover:text-[#F5A623] transition-colors line-clamp-3">
            {article.title}
          </h2>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-white/60">
            <span>{formatRelative(article.publishedAt!)}</span>
            <span className="flex items-center gap-1"><Eye size={10} />{formatHitCount(article.hits)}</span>
          </div>
        </div>
      </Link>
    )
  }

  // default card
  return (
    <Link href={href} className="flex flex-col rounded-xl overflow-hidden bg-[#161616] border border-[#2A2A2A] group card-hover">
      {image && (
        <div className="relative aspect-[16/9] bg-[#1F1F1F] overflow-hidden">
          <Image
            src={image}
            alt={article.imageAlt || article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-2 left-2">
            <span className="bg-[#C8102E] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
              {article.category.name}
            </span>
          </div>
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        {!image && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C8102E] mb-1">
            {article.category.name}
          </span>
        )}
        <h3 className="text-sm font-semibold text-white group-hover:text-[#F5A623] transition-colors leading-snug line-clamp-3 flex-1">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-[12px] text-[#6B7280] mt-2 line-clamp-2">
            {truncate(article.excerpt, 120)}
          </p>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2A2A2A]">
          <span className="text-[11px] text-[#6B7280]">{formatRelative(article.publishedAt!)}</span>
          <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
            <span className="flex items-center gap-1"><Clock size={10} />{minutes}m</span>
            {article.hits > 0 && (
              <span className="flex items-center gap-1 text-[#F5A623]">
                <Eye size={10} />{formatHitCount(article.hits)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
