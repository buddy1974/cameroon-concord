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

export function ArticleCard({ article, variant = 'default', priority = false, index }: Props) {
  const href = `/${article.category.slug}/${article.slug}`
  const mins = readingTime(article.body)
  const src  = cleanSrc(article.featuredImage)
  const tags = safeJsonArray<string>((article as Record<string, unknown>).countryTags)

  /* ── HERO ── */
  if (variant === 'hero') {
    return (
      <Link href={href} style={{ display: 'block', textDecoration: 'none', borderRadius: 20, overflow: 'hidden', position: 'relative', aspectRatio: '21/9', minHeight: 320, background: 'hsl(var(--card))' }} className="card-lift img-zoom">
        {src && <img src={src} alt={article.title} loading={priority ? 'eager' : 'lazy'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />}
        <div className="bg-card-gradient" style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(20px, 4vw, 40px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {article.isBreaking && <span style={{ background: 'hsl(43 74% 60%)', color: '#000', fontSize: '0.6rem', fontWeight: 900, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>⚡ Breaking</span>}
            <span className="cat-pill">{article.category.name.toUpperCase()}</span>
            {tags.slice(0, 2).map(t => <span key={t} style={{ background: 'hsl(43 40% 30%)', color: 'hsl(43 74% 60%)', fontSize: '0.52rem', fontWeight: 700, padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t}</span>)}
          </div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(1.4rem, 3vw, 2.4rem)', fontWeight: 900, lineHeight: 1.08, color: '#fff', letterSpacing: '-0.02em', marginBottom: 10 }}>
            {article.title}
          </h2>
          {article.excerpt && <p style={{ fontSize: '0.9rem', color: 'hsl(0 0% 72%)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 10 }}>{truncate(article.excerpt, 160)}</p>}
          <div style={{ fontSize: '0.72rem', color: 'hsl(0 0% 52%)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>{formatRelative(article.publishedAt!)}</span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{mins}m</span>
            {article.hits > 100 && <><span>·</span><span style={{ color: 'hsl(var(--accent))', display: 'inline-flex', alignItems: 'center', gap: 3 }}><Eye size={10} />{formatHitCount(article.hits)}</span></>}
          </div>
        </div>
      </Link>
    )
  }

  /* ── FEATURED ── */
  if (variant === 'featured') {
    return (
      <Link href={href} style={{ display: 'block', textDecoration: 'none' }} className="card-lift">
        <article style={{ overflow: 'hidden', borderRadius: 20, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
          <div className="img-zoom" style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden', background: 'hsl(var(--card))' }}>
            {src && <img src={src} alt={article.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.currentTarget.style.display = 'none' }} />}
            <div style={{ position: 'absolute', top: 16, left: 16 }}>
              <span className="kicker" style={{ background: 'hsl(222 15% 7% / 0.8)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: 9999 }}>{article.category.name}</span>
            </div>
          </div>
          <div style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', fontWeight: 700, color: 'hsl(var(--card-foreground))', lineHeight: 1.3, marginBottom: 12 }}>
              {article.title}
            </h3>
            {article.excerpt && <p style={{ fontSize: '0.88rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 16 }}>{article.excerpt}</p>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))' }}>
              <span>{article.author?.name || 'Cameroon Concord'}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{mins} min</span>
            </div>
          </div>
        </article>
      </Link>
    )
  }

  /* ── COMPACT ── */
  if (variant === 'compact') {
    return (
      <Link href={href} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, textDecoration: 'none' }} className="card-lift">
        {src && (
          <div className="img-zoom" style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: 'hsl(var(--card))' }}>
            <img src={src} alt={article.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.parentElement!.style.display = 'none' }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '0.82rem', fontWeight: 600, color: 'hsl(var(--card-foreground))', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {article.title}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: '0.62rem', color: 'hsl(var(--muted-foreground))' }}>
            <span>{formatRelative(article.publishedAt!)}</span>
            {article.hits > 100 && <span style={{ color: 'hsl(var(--accent))' }}>{formatHitCount(article.hits)}</span>}
          </div>
        </div>
      </Link>
    )
  }

  /* ── HORIZONTAL ── */
  if (variant === 'horizontal') {
    return (
      <Link href={href} style={{ display: 'flex', gap: 16, textDecoration: 'none' }} className="card-lift">
        {src && (
          <div className="img-zoom" style={{ width: 112, height: 80, flexShrink: 0, borderRadius: 10, overflow: 'hidden', background: 'hsl(var(--card))' }}>
            <img src={src} alt={article.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.parentElement!.style.display = 'none' }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="kicker" style={{ fontSize: '0.52rem', marginBottom: 4 }}>{article.category.name}</div>
          <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '0.88rem', fontWeight: 600, color: 'hsl(var(--foreground))', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {article.title}
          </h3>
          <div style={{ fontSize: '0.62rem', color: 'hsl(var(--muted-foreground))', marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Clock size={9} />{mins} min · {formatRelative(article.publishedAt!)}
          </div>
        </div>
      </Link>
    )
  }

  /* ── LIST (numbered) ── */
  if (variant === 'list') {
    return (
      <Link href={href} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
        <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: '1.8rem', fontWeight: 900, lineHeight: 1, flexShrink: 0, marginTop: 2, color: 'hsl(var(--border))', minWidth: '2rem' }}>
          {((index ?? 0) + 1).toString().padStart(2, '0')}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '0.88rem', fontWeight: 600, color: 'hsl(var(--foreground))', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {article.title}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: '0.62rem', color: 'hsl(var(--muted-foreground))' }}>
            <span>{formatRelative(article.publishedAt!)}</span>
            {article.hits > 100 && <span style={{ color: 'hsl(var(--accent))', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 2 }}><Eye size={9} />{formatHitCount(article.hits)}</span>}
          </div>
        </div>
        {src && (
          <div className="img-zoom" style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: 'hsl(var(--card))' }}>
            <img src={src} alt={article.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.parentElement!.style.display = 'none' }} />
          </div>
        )}
      </Link>
    )
  }

  /* ── DEFAULT CARD ── */
  return (
    <Link href={href} style={{ display: 'block', textDecoration: 'none', height: '100%' }} className="card-lift">
      <article style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 16, overflow: 'hidden', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
        {/* Image */}
        <div className="img-zoom" style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: 'hsl(var(--card))' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, hsl(220 14% 10%) 0%, hsl(222 15% 7%) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'hsl(354 78% 50% / 0.12)', fontSize: '4rem', fontWeight: 900 }}>{article.category.name.charAt(0)}</span>
          </div>
          {src && <img src={src} alt={article.title} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />}
          {/* Category badge — top-left glass pill */}
          <div style={{ position: 'absolute', top: 12, left: 12 }}>
            <span className="kicker" style={{ background: 'hsl(222 15% 7% / 0.8)', backdropFilter: 'blur(8px)', padding: '3px 10px', borderRadius: 9999 }}>{article.category.name}</span>
          </div>
          {article.isBreaking && (
            <div style={{ position: 'absolute', top: 12, right: 12 }}>
              <span style={{ background: 'hsl(43 74% 60%)', color: '#000', fontSize: '0.52rem', fontWeight: 900, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>⚡</span>
            </div>
          )}
          {tags.length > 0 && (
            <div style={{ position: 'absolute', bottom: 8, left: 12, display: 'flex', gap: 3 }}>
              {tags.slice(0, 2).map(t => <span key={t} style={{ background: 'hsl(43 40% 30%)', color: 'hsl(43 74% 60%)', fontSize: '0.48rem', fontWeight: 700, padding: '2px 5px', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t}</span>)}
            </div>
          )}
        </div>
        {/* Content */}
        <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--card-foreground))', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
            {article.title}
          </h3>
          {article.excerpt && (
            <p style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {article.excerpt}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', paddingTop: 10, borderTop: '1px solid hsl(var(--border) / 0.5)' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
              {article.author?.name || 'Cameroon Concord'}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {article.hits > 100 ? (
                <span style={{ color: 'hsl(var(--accent))', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}><Eye size={10} />{formatHitCount(article.hits)}</span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{mins} min</span>
              )}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
