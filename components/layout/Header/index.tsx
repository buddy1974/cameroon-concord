'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Search } from 'lucide-react'
import { NAV_CATEGORIES } from '@/lib/constants'

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-[#2A2A2A]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-white">
              CAMEROON<span className="text-[#C8102E]">CONCORD</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="p-2 text-[#6B7280] hover:text-white transition-colors"
              aria-label="Search"
            >
              <Search size={18} />
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-[#6B7280] hover:text-white"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 pb-2 overflow-x-auto">
          {NAV_CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              href={`/${cat.slug}`}
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] hover:text-white hover:bg-[#1F1F1F] rounded transition-colors whitespace-nowrap"
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href="/southern-cameroons"
            className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#F5A623] hover:bg-[#1F1F1F] rounded transition-colors whitespace-nowrap ml-auto"
          >
            S. Cameroons
          </Link>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="md:hidden pb-4 grid grid-cols-2 gap-1">
            {NAV_CATEGORIES.map(cat => (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-[#9CA3AF] hover:text-white hover:bg-[#1F1F1F] rounded transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
