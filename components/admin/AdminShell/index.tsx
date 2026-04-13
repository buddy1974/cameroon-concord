'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const NAV = [
  { href: '/admin',                        label: '📊 Dashboard' },
  { href: '/admin/articles/new',           label: '✏️ New Article' },
  { href: '/admin/quick-publish',          label: '⚡ Quick Publish' },
  { href: '/admin/articles',               label: '📰 All Articles' },
  { href: '/admin/articles?status=draft',  label: '📝 Drafts' },
  { href: '/admin/comments',              label: '💬 Comments' },
  { href: '/admin/newsletter',            label: '📬 Newsletter' },
  { href: '/admin/categories',             label: '📁 Categories' },
  { href: '/',                             label: '🌐 View Site' },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const statusParam = searchParams.get('status')

  function isActive(href: string): boolean {
    if (href === '/admin/articles?status=draft') {
      return pathname === '/admin/articles' && statusParam === 'draft'
    }
    if (href === '/admin/articles') {
      return pathname === '/admin/articles' && statusParam !== 'draft'
    }
    return pathname === href
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-6 border-b border-[#1A1A1A]">
        <Image src="/logo.png" alt="Cameroon Concord" width={140} height={35} />
        <span style={{ fontSize: '11px', color: '#888', display: 'block', marginTop: '4px' }}>ADMIN</span>
      </div>

      <nav className="flex-1 flex flex-col gap-1 p-3">
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`block px-3 py-2 rounded-lg text-[0.8rem] font-medium no-underline transition-colors ${
              isActive(item.href) ? 'text-white bg-[#181818]' : 'text-[#555] hover:text-white hover:bg-[#181818]'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-[#1A1A1A]">
        <button
          onClick={() => { window.location.href = '/api/admin/logout' }}
          className="block px-3 py-2 text-[0.75rem] text-[#333] hover:text-white no-underline rounded-lg transition-colors"
        >
          → Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050505] flex">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] flex-shrink-0 bg-[#0A0A0A] border-r border-[#1A1A1A]">
        {sidebar}
      </aside>

      {/* Mobile overlay sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[240px] bg-[#0A0A0A] border-r border-[#1A1A1A] flex flex-col">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[#1A1A1A] bg-[#0A0A0A]">
          <button onClick={() => setOpen(true)} className="text-[#555] hover:text-white transition-colors">
            <Menu size={20} />
          </button>
          <Image src="/logo.png" alt="Cameroon Concord" width={120} height={30} />
          {open && (
            <button onClick={() => setOpen(false)} className="ml-auto text-[#555] hover:text-white transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>

    </div>
  )
}
