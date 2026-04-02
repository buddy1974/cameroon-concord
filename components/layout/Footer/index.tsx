import Link from 'next/link'
import { SITE_NAME, CATEGORIES, SITE_FB } from '@/lib/constants'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-[#1E1E1E] mt-12">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          <div className="col-span-2 md:col-span-1">
            <Link href="/">
              <span className="text-xl font-black tracking-[-0.04em] uppercase text-white">
                Cameroon<span className="text-[#C8102E]">Concord</span>
              </span>
            </Link>
            <p className="text-[#444] text-xs mt-3 leading-relaxed max-w-[200px]">
              Independent news covering Cameroon and Southern Cameroons since 2014.
            </p>
            <div className="flex gap-4 mt-4">
              <a href={SITE_FB} target="_blank" rel="noopener noreferrer" className="text-[0.65rem] font-bold uppercase tracking-wider text-[#444] hover:text-[#C8102E] transition-colors">Facebook</a>
              <a href="https://twitter.com/CameroonC" target="_blank" rel="noopener noreferrer" className="text-[0.65rem] font-bold uppercase tracking-wider text-[#444] hover:text-[#C8102E] transition-colors">Twitter/X</a>
            </div>
          </div>

          <div>
            <p className="text-[0.58rem] font-black uppercase tracking-[0.2em] text-[#2A2A2A] mb-4">Topics</p>
            <ul className="space-y-2.5">
              {CATEGORIES.slice(0, 6).map(c => (
                <li key={c.slug}>
                  <Link href={`/${c.slug}`} className="text-xs text-[#444] hover:text-white transition-colors">{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[0.58rem] font-black uppercase tracking-[0.2em] text-[#2A2A2A] mb-4">More</p>
            <ul className="space-y-2.5">
              {[
                { href: '/search',      label: 'Search'  },
                { href: '/api/rss',     label: 'RSS Feed' },
                { href: '/sitemap.xml', label: 'Sitemap' },
              ].map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="text-xs text-[#444] hover:text-white transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[0.58rem] font-black uppercase tracking-[0.2em] text-[#2A2A2A] mb-4">Newsletter</p>
            <p className="text-xs text-[#333] leading-relaxed mb-4">Get Cameroon news delivered to your inbox.</p>
            <a href="mailto:admin@cameroon-concord.com"
              className="inline-block text-[0.62rem] font-black uppercase tracking-wider bg-[#C8102E] text-white px-4 py-2 rounded-lg hover:bg-[#8B0000] transition-colors">
              Contact Us
            </a>
          </div>

        </div>
      </div>
      <div className="border-t border-[#1A1A1A]">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <p className="text-[0.6rem] text-[#2A2A2A]">© {year} {SITE_NAME}. All Rights Reserved.</p>
          <p className="text-[0.6rem] text-[#2A2A2A]">Cameroon · S. Cameroons · Africa</p>
        </div>
      </div>
    </footer>
  )
}
