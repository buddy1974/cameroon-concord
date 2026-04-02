'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Menu, X } from 'lucide-react'
import { NAV_CATEGORIES } from '@/lib/constants'

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-[#080808]/98 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.04)]'
        : 'bg-[#080808]'
    }`}>
      {/* Top identity bar */}
      <div className="border-b border-[#1E1E1E]">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-0 group">
            <span className="text-[1.4rem] font-black tracking-[-0.04em] text-white uppercase">
              Cameroon
            </span>
            <span className="text-[1.4rem] font-black tracking-[-0.04em] text-[#C8102E] uppercase">
              Concord
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="w-9 h-9 flex items-center justify-center text-[#555] hover:text-white transition-colors rounded-lg hover:bg-[#1A1A1A]">
              <Search size={17} />
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center text-[#555] hover:text-white transition-colors rounded-lg hover:bg-[#1A1A1A]"
              aria-label="Menu">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop nav */}
      <nav className="hidden lg:block border-b border-[#1E1E1E]">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-0 overflow-x-auto">
            {NAV_CATEGORIES.map(cat => {
              const active = pathname === `/${cat.slug}` || pathname.startsWith(`/${cat.slug}/`)
              return (
                <Link
                  key={cat.slug}
                  href={`/${cat.slug}`}
                  className={`relative px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.1em] whitespace-nowrap transition-colors ${
                    active
                      ? 'text-[#C8102E] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#C8102E] after:content-[""]'
                      : 'text-[#666] hover:text-white'
                  }`}>
                  {cat.name}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 top-[57px] bg-[#080808] z-50 overflow-y-auto">
          <nav className="p-4 grid grid-cols-2 gap-2">
            {NAV_CATEGORIES.map(cat => (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                className="flex items-center gap-2 px-4 py-3 bg-[#111111] rounded-xl text-sm font-semibold text-[#999] hover:text-white hover:bg-[#1A1A1A] transition-all border border-[#1E1E1E]">
                <span className="w-2 h-2 rounded-full bg-[#C8102E] flex-shrink-0" />
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
