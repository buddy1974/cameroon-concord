'use client'
import { useState } from 'react'

interface Props {
  articleId: number
  title: string
  url: string
  /** When true, renders a horizontal wrapping row for mobile placement */
  horizontal?: boolean
}

export function ShareRail({ title, url, horizontal = false }: Props) {
  const [liked,      setLiked]      = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [copied,     setCopied]     = useState(false)

  function share(platform: string) {
    const encoded = encodeURIComponent(url)
    const text    = encodeURIComponent(title)
    if (platform === 'twitter')  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encoded}`, '_blank', 'noopener')
    if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`, '_blank', 'noopener')
    if (platform === 'whatsapp') window.open(`https://wa.me/?text=${text}%20${encoded}`, '_blank', 'noopener')
    if (platform === 'copy') {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => {})
    }
  }

  const btnSize = horizontal ? 44 : 40

  const base: React.CSSProperties = {
    width: btnSize, height: btnSize, borderRadius: '50%',
    border: '1px solid var(--border)', background: 'var(--bg-surface)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s ease',
    color: 'var(--text-secondary)', flexShrink: 0,
  }

  const buttons = (
    <>
      <button
        style={{ ...base, color: liked ? 'var(--brand)' : 'var(--text-secondary)', borderColor: liked ? 'var(--brand)' : 'var(--border)', background: liked ? 'hsla(354,78%,50%,0.08)' : 'var(--bg-surface)' }}
        onClick={() => setLiked(!liked)} title="Like article" aria-label="Like"
      >♥</button>
      <button
        style={{ ...base, color: bookmarked ? 'var(--gold)' : 'var(--text-secondary)', borderColor: bookmarked ? 'var(--gold)' : 'var(--border)', background: bookmarked ? 'hsla(43,74%,60%,0.08)' : 'var(--bg-surface)' }}
        onClick={() => setBookmarked(!bookmarked)} title="Bookmark" aria-label="Bookmark"
      >🔖</button>
      {!horizontal && <div style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '2px 0' }} />}
      <button style={base} onClick={() => share('twitter')}  title="Share on X/Twitter" aria-label="Share on X">𝕏</button>
      <button style={base} onClick={() => share('facebook')} title="Share on Facebook"  aria-label="Share on Facebook">f</button>
      <button style={base} onClick={() => share('whatsapp')} title="Share on WhatsApp"  aria-label="Share on WhatsApp">💬</button>
      <button
        style={{ ...base, color: copied ? '#22C55E' : 'var(--text-secondary)', borderColor: copied ? '#22C55E' : 'var(--border)' }}
        onClick={() => share('copy')} title={copied ? 'Copied!' : 'Copy link'} aria-label="Copy link"
      >{copied ? '✓' : '🔗'}</button>
    </>
  )

  /* ── Horizontal mode: mobile share bar ── */
  if (horizontal) {
    return (
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        {buttons}
      </div>
    )
  }

  /* ── Default: vertical sticky desktop rail ── */
  return (
    <div style={{
      position: 'sticky', top: '120px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
      width: '48px',
    }}>
      {buttons}
    </div>
  )
}
