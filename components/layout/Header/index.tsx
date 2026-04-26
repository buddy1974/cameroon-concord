'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Search, Menu, X } from 'lucide-react'
import { NAV_CATEGORIES } from '@/lib/constants'
import { ThemeToggle } from '@/components/common/ThemeToggle'

interface BreakingItem { title: string; slug: string; catSlug: string }

export function Header() {
  const [open,     setOpen]     = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [breaking, setBreaking] = useState<BreakingItem[]>([])
  const pathname = usePathname()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    fetch('/api/articles/breaking')
      .then(r => r.json())
      .then((d: unknown) => { if (Array.isArray(d)) setBreaking(d as BreakingItem[]) })
      .catch(() => {})
  }, [])

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50 }}>

      {/* Main nav bar */}
      <div style={{
        transition: 'all 0.3s ease',
        background: scrolled ? 'var(--bg-glass)' : 'var(--bg-base)',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: '1px solid var(--border)',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.4)' : 'none',
      }}>
        <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <Image src="/logo.png" alt="Cameroon Concord" width={180} height={32} priority className="h-8 w-auto" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_CATEGORIES.map(cat => {
              const active = pathname === `/${cat.slug}` || pathname.startsWith(`/${cat.slug}/`)
              return (
                <Link key={cat.slug} href={`/${cat.slug}`} style={{
                  position: 'relative',
                  padding: '6px 12px',
                  fontSize: '0.67rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  color: active ? 'var(--brand)' : 'var(--text-muted)',
                  transition: 'color 0.15s ease',
                }}>
                  {active && (
                    <span style={{ position: 'absolute', bottom: 0, left: '12px', right: '12px', height: 2, background: 'var(--brand)', borderRadius: 1 }} />
                  )}
                  {cat.name}
                </Link>
              )
            })}
            <Link href="/my-feed" style={{
              padding: '6px 12px',
              fontSize: '0.67rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: pathname === '/my-feed' ? 'var(--gold)' : 'color-mix(in srgb, var(--gold) 60%, transparent)',
              textDecoration: 'none',
              marginLeft: 4,
              borderLeft: '1px solid var(--border)',
              paddingLeft: 14,
              transition: 'color 0.15s ease',
            }}>
              My Feed
            </Link>
          </nav>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link href="/search" aria-label="Search" style={{
              width: 36, height: 36, display: 'grid', placeItems: 'center',
              borderRadius: 8, color: 'var(--text-muted)', transition: 'all 0.15s ease',
              textDecoration: 'none',
            }}
              className="hover:text-white hover:bg-[#181818]">
              <Search size={16} strokeWidth={2.5} />
            </Link>
            <ThemeToggle />
            <button onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'}
              style={{
                width: 36, height: 36, display: 'grid', placeItems: 'center',
                borderRadius: 8, color: 'var(--text-muted)', background: 'none',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
              }}
              className="lg:hidden hover:text-white hover:bg-[#181818]">
              {open ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>
      </div>

      {/* Breaking ticker */}
      {breaking.length > 0 && (
        <div style={{
          background: 'var(--brand)',
          borderBottom: '1px solid rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          height: 32,
        }}>
          <div style={{
            flexShrink: 0,
            padding: '0 14px',
            fontSize: '0.6rem',
            fontWeight: 900,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#fff',
            borderRight: '1px solid rgba(255,255,255,0.3)',
            whiteSpace: 'nowrap',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.15)',
          }}>
            ⚡ Breaking
          </div>
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            <div className="animate-marquee" style={{ display: 'flex', gap: '40px', whiteSpace: 'nowrap', paddingLeft: 20 }}>
              {[...breaking, ...breaking].map((item, i) => (
                <Link key={i} href={`/${item.catSlug}/${item.slug}`} style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#fff',
                  textDecoration: 'none',
                  flexShrink: 0,
                  opacity: 0.9,
                  transition: 'opacity 0.15s',
                }}
                  className="hover:opacity-100">
                  {item.title}
                  <span style={{ marginLeft: 40, color: 'rgba(255,255,255,0.4)' }}>·</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile nav */}
      {open && (
        <nav style={{
          position: 'fixed',
          inset: '0 0 0 0',
          top: 56,
          bottom: 0,
          background: 'var(--bg-base)',
          zIndex: 50,
          overflowY: 'auto',
          padding: 16,
          borderTop: '1px solid var(--border)',
        }}
          className="lg:hidden">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Link href="/" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', background: 'var(--bg-elevated)',
              border: '1px solid var(--brand)', borderRadius: 12,
              fontSize: '0.875rem', fontWeight: 600, color: '#fff',
              textDecoration: 'none', gridColumn: '1 / -1',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0 }} />
              Home
            </Link>
            {NAV_CATEGORIES.map(cat => (
              <Link key={cat.slug} href={`/${cat.slug}`} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', background: 'var(--bg-elevated)',
                border: '1px solid var(--border)', borderRadius: 12,
                fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)',
                textDecoration: 'none', transition: 'all 0.15s ease',
              }}
                className="hover:text-white hover:border-brand">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0 }} />
                {cat.name}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
