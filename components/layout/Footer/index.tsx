import Link from 'next/link'
import { SITE_NAME, SITE_TAGLINE, CATEGORIES, SITE_FB } from '@/lib/constants'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-[#0D0D0D] border-t border-[#2A2A2A] mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <span className="text-2xl font-black tracking-tight text-white">
              CAMEROON<span className="text-[#C8102E]">CONCORD</span>
            </span>
            <p className="text-[#6B7280] text-sm mt-3 leading-relaxed max-w-sm">
              {SITE_TAGLINE}. Independent news covering Cameroon and Southern Cameroons since 2014.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <a
                href={SITE_FB}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6B7280] hover:text-[#C8102E] text-sm font-medium transition-colors"
              >
                Facebook
              </a>
              <a
                href="https://twitter.com/CameroonC"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6B7280] hover:text-[#C8102E] text-sm font-medium transition-colors"
              >
                Twitter/X
              </a>
              <a
                href="/api/rss"
                className="text-[#6B7280] hover:text-[#F5A623] text-sm font-medium transition-colors"
              >
                RSS
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4">Topics</h4>
            <ul className="space-y-2">
              {CATEGORIES.slice(0, 6).map(cat => (
                <li key={cat.slug}>
                  <Link
                    href={`/${cat.slug}`}
                    className="text-sm text-[#6B7280] hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4">More</h4>
            <ul className="space-y-2">
              {[
                { href: '/en/about-us',   label: 'About Us' },
                { href: '/en/contact-us', label: 'Contact'  },
                { href: '/api/rss',       label: 'RSS Feed' },
                { href: '/search',        label: 'Search'   },
              ].map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-[#6B7280] hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2A2A2A] mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#4B5563]">
            © {year} {SITE_NAME}. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
