'use client'
import Link from 'next/link'
import { Clock, Eye } from 'lucide-react'
import type { ArticleWithRelations } from '@/lib/types'
import { formatRelative, readingTime, formatHitCount, truncate } from '@/lib/utils'
import { safeJsonArray } from '@/lib/utils/safe-json'

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

function CountryTagStrip({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
      {tags.slice(0, 3).map(t => (
        <span key={t} style={{ background: 'var(--gold-muted)', color: 'var(--gold)', fontSize: '0.52rem', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.4 }}>
          {t}
        </span>
      ))}
    </div>
  )
}

export function ArticleCard({ article, variant = 'default', priority = false, index }: Props) {
  const href = `/${article.category.slug}/${article.slug}`
  const mins = readingTime(article.body)
  const src  = cleanSrc(article.featuredImage)
  const tags = safeJsonArray<string>((article as Record<string, unknown>).countryTags)

  /* ── HERO ── */
  if (variant === 'hero') {
    return (
      <Link href={href} style={{ display: 'block', textDecoration: 'none' }} className="card-lift">
        <div style={{ position: 'relative', width: '100%', aspectRatio: '21/9', minHeight: 320, borderRadius: 20, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
          {src && (
            <img src={src} alt={article.title} loading={priority ? 'eager' : 'lazy'}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 40%, transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {article.isBreaking && (
                <span style={{ background: 'var(--gold)', color: '#000', fontSize: '0.58rem', fontWeight: 900, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>⚡ Breaking</span>
              )}
              <span className="cat-pill">{article.category.name.toUpperCase()}</span>
              <CountryTagStrip tags={tags} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(1.5rem, 3vw, 2.6rem)', fontWeight: 900, lineHeight: 1.1, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              {article.title}
            </h2>
            {article.excerpt && (
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {truncate(article.excerpt, 160)}
              </p>
            )}
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 }}>
              <span>{formatRelative(article.publishedAt!)}</span>
              <span>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{mins}m read</span>
              {article.hits > 100 && <><span>·</span><span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gold)' }}><Eye size={11} />{formatHitCount(article.hits)}</span></>}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  /* ── FEATURED ── */
  if (variant === 'featured') {
    return (
      <Link href={href} style={{ display: 'block', textDecoration: 'none', borderRadius: 16, overflow: 'hidden', height: '100%', position: 'relative', background: 'var(--bg-elevated)' }} className="card-lift img-zoom">
        {src && <img src={src} alt={article.title} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0.2), transparent)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
            <span className="cat-pill">{article.category.name}</span>
            <CountryTagStrip tags={tags} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '1rem', fontWeight: 700, color: '#fff', lineHeight: 1.3, margin: 0 }}>{article.title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, fontSize: '0.65rem', color: 'rgba(255,255,255,0.55)' }}>
            <span>{formatRelative(article.publishedAt!)}</span>
            {article.hits > 100 && <span style={{ color: 'var(--gold)' }}>{formatHitCount(article.hits)}</span>}
          </div>
        </div>
      </Link>
    )
  }

  /* ── COMPACT ── */
  if (variant === 'compact') {
    return (
      <Link href={href} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, textDecoration: 'none' }} className="card-lift">
        {src && (
          <div className="img-zoom" style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
            <img src={src} alt={article.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.parentElement!.style.display = 'none' }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {article.title}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: '0.62rem', color: 'var(--text-muted)' }}>
            <span>{formatRelative(article.publishedAt!)}</span>
            {article.hits > 100 && <span style={{ color: 'var(--gold)' }}>{formatHitCount(article.hits)}</span>}
          </div>
        </div>
      </Link>
    )
  }

  /* ── HORIZONTAL ── */
  if (variant === 'horizontal') {
    return (
      <Link href={href} style={{ display: 'flex', gap: 12, textDecoration: 'none', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }} className="card-lift">
        {src && (
          <div className="img-zoom" style={{ width: 80, height: 56, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
            <img src={src} alt={article.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.parentElement!.style.display = 'none' }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="cat-pill" style={{ marginBottom: 4, fontSize: '0.52rem' }}>{article.category.name}</div>
          <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
            {article.title}
          </h3>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={9} />{mins}m · {formatRelative(article.publishedAt!)}
          </div>
        </div>
      </Link>
    )
  }

  /* ── LIST (numbered) ── */
  if (variant === 'list') {
    return (
      <Link href={href} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: '1.8rem', fontFamily: 'var(--font-fraunces)', fontWeight: 900, lineHeight: 1, flexShrink: 0, marginTop: 2, color: 'var(--border)', minWidth: '2rem' }}>
          {((index ?? 0) + 1).toString().padStart(2, '0')}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {article.title}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: '0.62rem', color: 'var(--text-muted)' }}>
            <span>{formatRelative(article.publishedAt!)}</span>
            {article.hits > 100 && <span style={{ color: 'var(--gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}><Eye size={9} />{formatHitCount(article.hits)}</span>}
          </div>
        </div>
        {src && (
          <div className="img-zoom" style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
            <img src={src} alt={article.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.parentElement!.style.display = 'none' }} />
          </div>
        )}
      </Link>
    )
  }

  /* ── DEFAULT CARD ── */
  return (
    <Link href={href} style={{ display: 'block', textDecoration: 'none', height: '100%' }} className="card-lift">
      <article style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 16, overflow: 'hidden', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        {/* Image */}
        <div className="img-zoom" style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--bg-elevated)', flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-base) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'rgba(200,16,46,0.12)', fontSize: '3.5rem', fontWeight: 900 }}>{article.category.name.charAt(0)}</span>
          </div>
          {src && (
            <img src={src} alt={article.title} loading="lazy"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          )}
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
            <span className="cat-pill">{article.category.name}</span>
            <CountryTagStrip tags={tags} />
          </div>
          {article.isBreaking && (
            <div style={{ position: 'absolute', top: 10, right: 10 }}>
              <span style={{ background: 'var(--gold)', color: '#000', fontSize: '0.52rem', fontWeight: 900, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>⚡</span>
            </div>
          )}
        </div>
        {/* Content */}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
            {article.title}
          </h3>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
            <span>{formatRelative(article.publishedAt!)}</span>
            <span>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={9} />{mins}m</span>
            {article.hits > 100 && <><span>·</span><span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--gold)', fontWeight: 600 }}><Eye size={9} />{formatHitCount(article.hits)}</span></>}
          </div>
        </div>
      </article>
    </Link>
  )
}
