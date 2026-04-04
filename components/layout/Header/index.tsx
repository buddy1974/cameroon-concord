'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Search, Menu, X } from 'lucide-react'
import { NAV_CATEGORIES } from '@/lib/constants'

export function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <header className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'bg-[#080808]/96 backdrop-blur-lg shadow-[0_1px_0_#1E1E1E]' : 'bg-[#080808]'}`}>

      {/* Logo + actions */}
      <div className="border-b border-[#1E1E1E]">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 flex items-center justify-between h-[52px]">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Cameroon Concord" width={200} height={36} priority className="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/search" className="w-9 h-9 grid place-items-center text-[#555] hover:text-white hover:bg-[#181818] rounded-lg transition-colors">
              <Search size={16} strokeWidth={2.5} />
            </Link>
            <button onClick={() => setOpen(!open)} className="lg:hidden w-9 h-9 grid place-items-center text-[#555] hover:text-white hover:bg-[#181818] rounded-lg transition-colors">
              {open ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop nav */}
      <nav className="hidden lg:block border-b border-[#1E1E1E]">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 flex items-center justify-center gap-2">
          {NAV_CATEGORIES.map(cat => {
            const active = pathname === `/${cat.slug}` || pathname.startsWith(`/${cat.slug}/`)
            return (
              <Link key={cat.slug} href={`/${cat.slug}`}
                className={`relative px-3 py-2.5 text-[0.68rem] font-bold uppercase tracking-[0.08em] whitespace-nowrap transition-all duration-150 border-r border-[#1E1E1E] last:border-0 ${active ? 'text-[#C8102E]' : 'text-[#666] hover:text-[#EEE]'}`}>
                {active && <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#C8102E] rounded-t" />}
                {cat.name}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile nav */}
      {open && (
        <nav className="lg:hidden fixed inset-x-0 top-[89px] bottom-0 bg-[#080808] z-50 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2">
            <Link href="/"
              className="flex items-center gap-2.5 px-4 py-3 bg-[#101010] border border-[#C8102E] rounded-xl text-sm font-semibold text-white transition-all col-span-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E] flex-shrink-0" />
              Home
            </Link>
            {NAV_CATEGORIES.map(cat => (
              <Link key={cat.slug} href={`/${cat.slug}`}
                className="flex items-center gap-2.5 px-4 py-3 bg-[#101010] border border-[#1E1E1E] rounded-xl text-sm font-semibold text-[#999] hover:text-white hover:border-[#C8102E] transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E] flex-shrink-0" />
                {cat.name}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
