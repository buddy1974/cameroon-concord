'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { NAV_CATEGORIES } from '@/lib/constants'

export function Header() {
  const pathname                      = usePathname()
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [scrolled,   setScrolled]     = useState(false)
  const [breaking,   setBreaking]     = useState<string[]>([])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    fetch('/api/articles/breaking')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setBreaking(d.map((a: { title: string }) => a.title)) })
      .catch(() => {})
  }, [])

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      padding: scrolled ? '8px 16px' : '16px 16px',
      transition: 'padding 500ms ease',
    }}>

      {/* ── GLASS PILL ── */}
      <div className="glass shadow-elegant" style={{
        maxWidth: '1400px', margin: '0 auto',
        borderRadius: '16px',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px',
      }}>

        {/* LEFT: Logo + Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>

          {/* Two-block text logo */}
          <Link href="/" aria-label="Cameroon Concord home" style={{
            display: 'inline-flex', alignItems: 'center',
            fontFamily: 'var(--font-fraunces)', fontWeight: 900,
            textDecoration: 'none', flexShrink: 0, letterSpacing: '0.04em',
          }}>
            <span style={{ background: '#F0F0F0', color: '#0A0A0A', padding: '4px 8px', lineHeight: 1, fontSize: '0.82rem' }}>
              CAMEROON
            </span>
            <span style={{ background: 'var(--brand)', color: '#fff', padding: '4px 8px', lineHeight: 1, fontSize: '0.82rem' }}>
              CONCORD
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex" style={{ alignItems: 'center', gap: '20px' }}>
            {NAV_CATEGORIES.map(cat => {
              const active = pathname === `/${cat.slug}` || pathname.startsWith(`/${cat.slug}/`)
              return (
                <Link
                  key={cat.slug}
                  href={`/${cat.slug}`}
                  className="link-underline"
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: active ? 600 : 400,
                    color: active ? '#fff' : 'hsl(0 0% 65%)',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.2s',
                  }}
                >
                  {cat.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* RIGHT: Search + Subscribe + Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>

          <Link href="/search" aria-label="Search"
            style={{ color: 'hsl(0 0% 65%)', textDecoration: 'none', lineHeight: 1, fontSize: '1.05rem' }}
            className="hidden md:inline-flex">
            🔍
          </Link>

          <Link href="/newsletter" className="hidden md:inline-flex animate-glow-pulse"
            style={{
              background: 'var(--brand)', color: '#fff',
              borderRadius: '24px', padding: '8px 20px',
              fontSize: '0.8rem', fontWeight: 700,
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
            Subscribe
          </Link>

          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#fff', fontSize: '1.2rem', padding: '4px', lineHeight: 1,
            }}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* ── MOBILE DROPDOWN ── */}
      {mobileOpen && (
        <div className="glass animate-fade-up shadow-elegant lg:hidden" style={{
          maxWidth: '1400px', margin: '8px auto 0',
          borderRadius: '16px', padding: '20px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            {NAV_CATEGORIES.map(cat => (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                onClick={() => setMobileOpen(false)}
                style={{
                  padding: '10px 14px', borderRadius: '10px',
                  background: 'hsl(0 0% 10%)',
                  color: 'hsl(0 0% 75%)', fontSize: '0.82rem', fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
          <Link
            href="/newsletter"
            onClick={() => setMobileOpen(false)}
            style={{
              display: 'block', textAlign: 'center',
              background: 'var(--brand)', color: '#fff',
              borderRadius: '12px', padding: '12px',
              fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
            }}
          >
            Subscribe Free
          </Link>
        </div>
      )}

      {/* ── BREAKING TICKER ── */}
      {breaking.length > 0 && (
        <div style={{
          maxWidth: '1400px', margin: '8px auto 0',
          background: 'hsl(354 78% 50% / 0.12)',
          border: '1px solid hsl(354 78% 50% / 0.25)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center',
          overflow: 'hidden', height: '32px',
        }}>
          <div style={{
            background: 'var(--brand)', color: '#fff',
            padding: '0 14px', height: '100%',
            display: 'flex', alignItems: 'center',
            fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.12em',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            ⚡ LIVE
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div className="animate-marquee" style={{ display: 'flex', gap: '48px', whiteSpace: 'nowrap', padding: '0 24px' }}>
              {[...breaking, ...breaking].map((title, i) => (
                <span key={i} style={{ fontSize: '0.72rem', color: 'hsl(0 0% 75%)', flexShrink: 0 }}>
                  {title}
                  <span style={{ color: 'var(--brand)', margin: '0 16px' }}>·</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
