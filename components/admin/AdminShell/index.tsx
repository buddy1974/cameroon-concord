'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'

/* ─────────────────────────────────────────
   Navigation items
───────────────────────────────────────── */
const CONTENT_NAV = [
  { href: '/admin',                                           icon: '📊',  label: 'Dashboard'         },
  { href: '/admin/articles/new',                              icon: '✏️',  label: 'New Article'        },
  { href: '/admin/articles',                                  icon: '📰',  label: 'All Articles'       },
  { href: '/admin/articles?status=draft',                     icon: '📝',  label: 'Drafts'             },
  { href: '/admin/articles?category=world-cup',               icon: '⚽',  label: 'World Cup Special'  },
  { href: '/admin/articles?category=world-cup&status=draft',  icon: '🟡',  label: 'WC Drafts'          },
]
const MANAGE_NAV = [
  { href: '/admin/comments',       icon: '💬', label: 'Comments'       },
  { href: '/admin/newsletter',     icon: '📬', label: 'Newsletter'     },
  { href: '/admin/categories',     icon: '📁', label: 'Categories'     },
  { href: '/admin/accountability', icon: '⚖️', label: 'Accountability' },
  { href: '/admin/exile-voices',   icon: '🕵️', label: 'Exile Voices'  },
]
/* mobile bottom bar — 5 slots, last = drawer */
const BOTTOM_NAV = [
  { href: '/admin',              icon: '📊', label: 'Home'     },
  { href: '/admin/quick-publish', icon: '⚡', label: 'Quick'   },
  { href: '/admin/articles/new', icon: '✏️', label: 'Write'   },
  { href: '/admin/articles',     icon: '📰', label: 'Articles' },
  { href: null,                  icon: '☰',  label: 'More'    },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname      = usePathname()
  const searchParams  = useSearchParams()
  const statusParam   = searchParams.get('status')
  const categoryParam = searchParams.get('category')

  function isActive(href: string | null): boolean {
    if (!href) return false
    const [hPath, hQuery] = href.split('?')
    const hParams   = new URLSearchParams(hQuery || '')
    const hStatus   = hParams.get('status')
    const hCategory = hParams.get('category')

    if (pathname !== hPath) return false

    if (hCategory) {
      return categoryParam === hCategory && (hStatus ? statusParam === hStatus : !statusParam)
    }
    if (href === '/admin/articles?status=draft') return pathname === '/admin/articles' && statusParam === 'draft' && !categoryParam
    if (href === '/admin/articles') return pathname === '/admin/articles' && !statusParam && !categoryParam
    if (href === '/admin')          return pathname === '/admin'
    return pathname.startsWith(href) && href !== '/admin' && href !== '/'
  }

  const navLink = (item: { href: string; icon: string; label: string }) => (
    <Link key={item.href} href={item.href} style={{
      display: 'flex', alignItems: 'center', gap: 9,
      padding: '9px 10px', borderRadius: 8, marginBottom: 1,
      textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600,
      color: isActive(item.href) ? '#fff' : '#4A4A4A',
      background: isActive(item.href) ? '#161616' : 'transparent',
      borderLeft: isActive(item.href) ? '3px solid #C8102E' : '3px solid transparent',
    }}>
      <span style={{ fontSize: '0.9rem' }}>{item.icon}</span> {item.label}
    </Link>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#050505', display: 'flex' }}>

      {/* ═══════════════════════════════════════
          DESKTOP SIDEBAR (hidden on mobile)
      ═══════════════════════════════════════ */}
      <aside className="cc-admin-sidebar" style={{
        width: 240, flexShrink: 0,
        background: '#080808', borderRight: '1px solid #1A1A1A',
        display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'sticky', top: 0, overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid #111' }}>
          <Image src="/logo.png" alt="Cameroon Concord" width={140} height={35} />
          <div style={{ fontSize: '0.5rem', color: '#2A2A2A', marginTop: 4, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase' }}>CMS Admin</div>
        </div>

        {/* ⚡ Persistent Quick Publish CTA */}
        <div style={{ padding: '14px 14px 6px' }}>
          <Link href="/admin/quick-publish" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'linear-gradient(135deg, #C8102E, #8B0000)',
            color: '#fff', padding: '12px 16px', borderRadius: 10,
            fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.08em',
            textDecoration: 'none', textTransform: 'uppercase',
            boxShadow: '0 2px 12px rgba(200,16,46,0.35)',
          }}>
            ⚡ Quick Publish
          </Link>
        </div>
        <div style={{ padding: '4px 14px 10px' }}>
          <Link href="/admin/articles/new" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#111', border: '1px solid #2A2A2A',
            color: '#ccc', padding: '10px 16px', borderRadius: 10,
            fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em',
            textDecoration: 'none',
          }}>
            ✏️ New Article
          </Link>
        </div>

        {/* Content nav */}
        <nav style={{ padding: '4px 10px', flex: 1 }}>
          <div style={{ fontSize: '0.48rem', color: '#252525', fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', padding: '10px 8px 5px' }}>Content</div>
          {CONTENT_NAV.map(navLink)}
          <div style={{ fontSize: '0.48rem', color: '#252525', fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', padding: '18px 8px 5px' }}>Manage</div>
          {MANAGE_NAV.map(navLink)}
        </nav>

        {/* Footer */}
        <div style={{ padding: '10px 10px 20px', borderTop: '1px solid #111' }}>
          <Link href="/" target="_blank" style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px',
            textDecoration: 'none', fontSize: '0.78rem', color: '#3A3A3A', borderRadius: 8,
          }}>
            <span>🌐</span> View Site
          </Link>
          <button onClick={() => { window.location.href = '/api/admin/logout' }} style={{
            display: 'flex', alignItems: 'center', gap: 9, width: '100%',
            padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
            background: 'transparent', border: 'none',
            fontSize: '0.78rem', fontWeight: 600, color: '#3A3A3A', textAlign: 'left',
          }}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Mobile top bar */}
        <header className="cc-admin-topbar" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px',
          background: '#080808', borderBottom: '1px solid #111',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <Image src="/logo.png" alt="Cameroon Concord" width={110} height={28} />
          <Link href="/admin/articles/new" style={{
            background: '#C8102E', color: '#fff', padding: '8px 14px',
            borderRadius: 8, fontSize: '0.75rem', fontWeight: 900,
            textDecoration: 'none',
          }}>
            ✏️ Write
          </Link>
        </header>

        {/* Page */}
        <main className="cc-admin-main" style={{ flex: 1, overflowX: 'hidden' }}>
          {children}
        </main>
      </div>

      {/* ═══════════════════════════════════════
          MOBILE BOTTOM NAV BAR
      ═══════════════════════════════════════ */}
      <nav className="cc-bottom-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#080808', borderTop: '1px solid #1A1A1A',
        display: 'flex', alignItems: 'stretch', zIndex: 150, height: 62,
      }}>
        {BOTTOM_NAV.map(item => {
          const active = item.href ? isActive(item.href) : drawerOpen
          return (
            <button
              key={item.label}
              onClick={() => {
                if (!item.href) { setDrawerOpen(!drawerOpen); return }
                setDrawerOpen(false)
                window.location.href = item.href
              }}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                background: item.label === 'Quick' && !active
                  ? 'rgba(200,16,46,0.08)'
                  : 'transparent',
                border: 'none', cursor: 'pointer',
                color: active ? '#C8102E' : (item.label === 'Quick' ? '#C8102E' : '#3A3A3A'),
                fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
                borderTop: active ? '2px solid #C8102E' : '2px solid transparent',
                padding: '4px 2px',
              }}
            >
              <span style={{ fontSize: item.label === 'Quick' ? '1.4rem' : '1.05rem', lineHeight: 1.2 }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* ═══════════════════════════════════════
          MOBILE "MORE" DRAWER (bottom sheet)
      ═══════════════════════════════════════ */}
      {drawerOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.72)',
        }} onClick={() => setDrawerOpen(false)}>
          <div
            style={{
              position: 'absolute', bottom: 62, left: 0, right: 0,
              background: '#0D0D0D', borderTop: '1px solid #1A1A1A',
              borderRadius: '20px 20px 0 0',
              padding: '0 0 20px', maxHeight: '80vh', overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 36, height: 4, background: '#222', borderRadius: 2, margin: '12px auto 16px' }} />

            {/* Drawer Quick Publish CTA */}
            <div style={{ padding: '0 14px 14px' }}>
              <Link href="/admin/quick-publish" onClick={() => setDrawerOpen(false)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'linear-gradient(135deg, #C8102E, #8B0000)',
                color: '#fff', padding: '15px 20px', borderRadius: 12,
                fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.06em',
                textDecoration: 'none', textTransform: 'uppercase',
                boxShadow: '0 2px 12px rgba(200,16,46,0.35)',
              }}>
                ⚡ Quick Publish
              </Link>
            </div>

            {/* All nav items in drawer */}
            {[...CONTENT_NAV, ...MANAGE_NAV, { href: '/', icon: '🌐', label: 'View Site' }].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setDrawerOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '15px 20px', textDecoration: 'none',
                fontSize: '0.9rem', fontWeight: 600,
                color: isActive(item.href) ? '#fff' : '#555',
                background: isActive(item.href) ? '#151515' : 'transparent',
                borderLeft: isActive(item.href) ? '3px solid #C8102E' : '3px solid transparent',
              }}>
                <span style={{ fontSize: '1.1rem', width: 26, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}

            <div style={{ padding: '12px 20px 0', borderTop: '1px solid #111', marginTop: 8 }}>
              <button onClick={() => { window.location.href = '/api/admin/logout' }} style={{
                display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                padding: '15px 0', cursor: 'pointer',
                background: 'transparent', border: 'none',
                fontSize: '0.9rem', fontWeight: 600, color: '#444', textAlign: 'left',
              }}>
                <span style={{ fontSize: '1.1rem', width: 26, textAlign: 'center' }}>🚪</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Responsive visibility CSS ── */}
      <style>{`
        .cc-admin-sidebar  { display: flex !important; }
        .cc-admin-topbar   { display: none !important; }
        .cc-bottom-nav     { display: none !important; }
        .cc-admin-main     { padding: 28px 24px 60px; }

        @media (max-width: 768px) {
          .cc-admin-sidebar { display: none !important; }
          .cc-admin-topbar  { display: flex !important; }
          .cc-bottom-nav    { display: flex !important; }
          .cc-admin-main    { padding: 16px 14px 80px !important; }
        }
      `}</style>
    </div>
  )
}
