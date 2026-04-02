import Link from 'next/link'
import Image from 'next/image'
import { Clock, Eye } from 'lucide-react'
import type { ArticleWithRelations } from '@/lib/types'
import { formatRelative, readingTime, formatHitCount, truncate } from '@/lib/utils'

interface Props {
  article:  ArticleWithRelations
  variant?: 'default' | 'featured' | 'compact' | 'horizontal' | 'hero'
  priority?: boolean
}

function cleanImage(url: string | null | undefined): string | null {
  if (!url) return null
  return url.split('#')[0].trim() || null
}

export function ArticleCard({ article, variant = 'default', priority = false }: Props) {
  const href    = `/${article.category.slug}/${article.slug}`
  const minutes = readingTime(article.body)
  const image   = cleanImage(article.featuredImage)

  if (variant === 'compact') {
    return (
      <Link href={href} className="flex items-start gap-3 group py-2.5">
        {image && (
          <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-[#1A1A1A]">
            <Image src={image} alt={article.imageAlt || article.title} fill className="object-cover" sizes="56px" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-[0.78rem] font-semibold text-[#DDD] group-hover:text-[#F5A623] transition-colors leading-snug line-clamp-2">
            {article.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[0.65rem] text-[#555]">{formatRelative(article.publishedAt!)}</span>
            {article.hits > 0 && (
              <span className="text-[0.65rem] text-[#444] flex items-center gap-0.5">
                <Eye size={9} />{formatHitCount(article.hits)}
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'hero') {
    return (
      <Link href={href} className="relative block w-full overflow-hidden rounded-2xl group aspect-[21/9] bg-[#111]">
        {image && (
          <Image src={image} alt={article.imageAlt || article.title} fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority={priority} sizes="100vw" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="flex items-center gap-2 mb-3">
            {article.isBreaking && (
              <span className="cat-badge bg-[#C8102E]">⚡ Breaking</span>
            )}
            <span className="cat-badge">{article.category.name}</span>
          </div>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-[-0.02em] group-hover:text-[#F5A623] transition-colors max-w-4xl">
            {article.title}
          </h2>
          {article.excerpt && (
            <p className="text-[#999] mt-3 text-sm md:text-base max-w-2xl line-clamp-2 hidden md:block">
              {truncate(article.excerpt, 160)}
            </p>
          )}
          <div className="flex items-center gap-4 mt-4 text-xs text-[#666]">
            <span>{formatRelative(article.publishedAt!)}</span>
            <span className="flex items-center gap-1"><Clock size={11} />{minutes}m</span>
            {article.hits > 0 && (
              <span className="flex items-center gap-1 text-[#F5A623]">
                <Eye size={11} />{formatHitCount(article.hits)}
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link href={href} className="relative block overflow-hidden rounded-xl group aspect-[4/3] bg-[#111] card-lift">
        {image && (
          <Image src={image} alt={article.imageAlt || article.title} fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width:768px) 100vw, 50vw" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span className="cat-badge mb-2 block w-fit">{article.category.name}</span>
          <h3 className="text-white font-black text-base leading-snug group-hover:text-[#F5A623] transition-colors line-clamp-3 tracking-[-0.01em]">
            {article.title}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-[0.65rem] text-[#888]">
            <span>{formatRelative(article.publishedAt!)}</span>
            {article.hits > 0 && <span className="text-[#F5A623]">{formatHitCount(article.hits)}</span>}
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'horizontal') {
    return (
      <Link href={href} className="flex gap-4 group card-lift">
        {image && (
          <div className="relative w-28 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-[#1A1A1A]">
            <Image src={image} alt={article.imageAlt || article.title} fill
              className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="112px" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="cat-badge mb-1.5">{article.category.name}</span>
          <h3 className="text-sm font-bold text-[#EEE] group-hover:text-[#F5A623] transition-colors leading-snug line-clamp-2 mt-1">
            {article.title}
          </h3>
          <div className="flex items-center gap-3 mt-1.5 text-[0.65rem] text-[#555]">
            <span>{formatRelative(article.publishedAt!)}</span>
            <span className="flex items-center gap-1"><Clock size={9} />{minutes}m</span>
          </div>
        </div>
      </Link>
    )
  }

  // Default card
  return (
    <Link href={href} className="flex flex-col rounded-2xl overflow-hidden bg-[#111111] border border-[#1E1E1E] group card-lift h-full">
      <div className="relative aspect-[16/9] bg-[#1A1A1A] overflow-hidden flex-shrink-0">
        {image ? (
          <Image src={image} alt={article.imageAlt || article.title} fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[#333] text-4xl font-black">{article.category.name.charAt(0)}</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="cat-badge">{article.category.name}</span>
        </div>
        {article.isBreaking && (
          <div className="absolute top-3 right-3">
            <span className="cat-badge bg-[#F5A623] text-black">⚡</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-[0.95rem] text-[#F0F0F0] group-hover:text-[#F5A623] transition-colors leading-snug line-clamp-3 flex-1 tracking-[-0.01em]">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-[0.75rem] text-[#555] mt-2 line-clamp-2 leading-relaxed">
            {truncate(article.excerpt, 100)}
          </p>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1E1E1E]">
          <span className="text-[0.65rem] text-[#444]">{formatRelative(article.publishedAt!)}</span>
          <div className="flex items-center gap-2.5 text-[0.65rem] text-[#444]">
            <span className="flex items-center gap-1"><Clock size={9} />{minutes}m</span>
            {article.hits > 0 && (
              <span className="flex items-center gap-1 text-[#F5A623] font-semibold">
                <Eye size={9} />{formatHitCount(article.hits)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
