'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { NAV_CATEGORIES } from '@/lib/constants'

interface BreakingItem { title: string; slug: string; categorySlug: string }

export function Header() {
  const pathname                    = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled,   setScrolled]   = useState(false)
  const [breaking,   setBreaking]   = useState<BreakingItem[]>([])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    fetch('/api/articles/breaking')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setBreaking(d as BreakingItem[]) })
      .catch(() => {})
  }, [])

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      padding: scrolled ? '6px 16px' : '14px 16px',
      transition: 'padding 500ms ease',
    }}>

      {/* ── GLASS PILL ── */}
      <div className="glass shadow-elegant" style={{
        maxWidth: '1400px', margin: '0 auto',
        borderRadius: '16px',
        padding: '10px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px',
      }}>
        {/* LEFT: Logo + Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', minWidth: 0 }}>
          <Link href="/" aria-label="Cameroon Concord" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ background: 'hsl(210 20% 95%)', color: 'hsl(222 15% 7%)', padding: '3px 8px', fontFamily: 'var(--font-fraunces)', fontWeight: 900, fontSize: '0.82rem', letterSpacing: '0.06em', lineHeight: 1.4 }}>CAMEROON</span>
            <span style={{ background: 'hsl(354 78% 50%)', color: '#fff', padding: '3px 8px', fontFamily: 'var(--font-fraunces)', fontWeight: 900, fontSize: '0.82rem', letterSpacing: '0.06em', lineHeight: 1.4 }}>CONCORD</span>
          </Link>
          <nav className="hidden lg:flex" style={{ alignItems: 'center', gap: '24px' }}>
            {NAV_CATEGORIES.map(cat => {
              const active = pathname === `/${cat.slug}` || pathname.startsWith(`/${cat.slug}/`)
              return (
                <Link key={cat.slug} href={`/${cat.slug}`} className="link-underline"
                  style={{ fontSize: '0.72rem', fontWeight: active ? 600 : 400, color: active ? '#fff' : 'hsl(220 8% 62%)', textDecoration: 'none', whiteSpace: 'nowrap', transition: 'color 0.2s', fontFamily: 'var(--font-roboto-mono), monospace' }}>
                  {cat.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* RIGHT: Search + Subscribe + Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <Link href="/search" aria-label="Search"
            style={{ color: 'hsl(220 8% 62%)', textDecoration: 'none', fontSize: '1.05rem', lineHeight: 1 }}
            className="hidden md:inline-flex">
            🔍
          </Link>
          <Link href="/newsletter" className="hidden md:inline-flex animate-glow-pulse"
            style={{ background: 'hsl(354 78% 50%)', color: '#fff', borderRadius: '24px', padding: '8px 22px', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', lineHeight: 1 }}>
            Subscribe
          </Link>
          <button className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '1.1rem', padding: '4px', lineHeight: 1 }}>
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* ── MOBILE DROPDOWN ── */}
      {mobileOpen && (
        <div className="glass animate-fade-up lg:hidden shadow-elegant" style={{ maxWidth: '1400px', margin: '8px auto 0', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            {NAV_CATEGORIES.map(cat => (
              <Link key={cat.slug} href={`/${cat.slug}`} onClick={() => setMobileOpen(false)}
                style={{ padding: '10px 14px', borderRadius: '10px', background: 'hsl(220 14% 10%)', color: 'hsl(220 8% 72%)', fontSize: '0.82rem', fontWeight: 500, textDecoration: 'none' }}>
                {cat.name}
              </Link>
            ))}
          </div>
          <Link href="/newsletter" onClick={() => setMobileOpen(false)}
            style={{ display: 'block', textAlign: 'center', background: 'hsl(354 78% 50%)', color: '#fff', borderRadius: '12px', padding: '12px', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
            Subscribe Free
          </Link>
        </div>
      )}

      {/* ── BREAKING TICKER ── */}
      {breaking.length > 0 && (
        <div className="glass" style={{ maxWidth: '1400px', margin: '8px auto 0', borderRadius: '10px', overflow: 'hidden', height: '36px', display: 'flex', alignItems: 'center' }}>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div className="animate-marquee" style={{ display: 'flex', whiteSpace: 'nowrap', padding: '0 24px' }}>
              {[...breaking, ...breaking].map((a, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'hsl(354 78% 55%)', letterSpacing: '0.15em', textTransform: 'uppercase', flexShrink: 0 }}>
                    LIVE
                  </span>
                  <Link
                    href={`/${a.categorySlug}/${a.slug}`}
                    style={{ fontSize: '0.76rem', color: 'hsl(220 8% 72%)', textDecoration: 'none', fontWeight: 400 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#fff' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'hsl(220 8% 72%)' }}
                  >
                    {a.title}
                  </Link>
                  <span style={{ color: 'hsl(220 8% 35%)', fontSize: '0.65rem', flexShrink: 0, margin: '0 16px 0 6px' }}>·</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
