import Link from 'next/link'
import { SITE_NAME, SITE_TAGLINE, CATEGORIES, SITE_FB, SITE_TWITTER } from '@/lib/constants'

export function Footer() {
  const year = new Date().getFullYear()
  const topics = CATEGORIES.slice(0, 7)

  return (
    <footer className="bg-[#0A0A0A] border-t border-[#1E1E1E] mt-16">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-14">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-0 mb-4">
              <span className="text-[1.3rem] font-black tracking-[-0.04em] text-white uppercase">Cameroon</span>
              <span className="text-[1.3rem] font-black tracking-[-0.04em] text-[#C8102E] uppercase">Concord</span>
            </Link>
            <p className="text-[0.78rem] text-[#555] leading-relaxed max-w-xs">
              {SITE_TAGLINE}. Independent English-language news covering Cameroon and Southern Cameroons.
            </p>
            <div className="flex items-center gap-4 mt-5">
              <a
                href={SITE_FB}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.72rem] font-semibold text-[#555] hover:text-[#C8102E] transition-colors uppercase tracking-wider">
                Facebook
              </a>
              <a
                href={`https://twitter.com/${SITE_TWITTER.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.72rem] font-semibold text-[#555] hover:text-[#C8102E] transition-colors uppercase tracking-wider">
                X
              </a>
              <a
                href="/api/rss"
                className="text-[0.72rem] font-semibold text-[#555] hover:text-[#F5A623] transition-colors uppercase tracking-wider">
                RSS
              </a>
            </div>
          </div>

          {/* Topics column */}
          <div>
            <h4 className="text-[0.6rem] font-black uppercase tracking-[0.18em] text-[#444] mb-5">Topics</h4>
            <ul className="space-y-2.5">
              {topics.map(cat => (
                <li key={cat.slug}>
                  <Link
                    href={`/${cat.slug}`}
                    className="group flex items-center gap-2 text-[0.78rem] text-[#555] hover:text-white transition-colors">
                    <span className="w-1 h-1 rounded-full bg-[#C8102E] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div>
            <h4 className="text-[0.6rem] font-black uppercase tracking-[0.18em] text-[#444] mb-5">Company</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/en/about-us',            label: 'About Us'        },
                { href: '/en/contact-us',          label: 'Contact'         },
                { href: '/en/advertise-with-us',   label: 'Advertise'       },
                { href: '/en/privacy-policy',      label: 'Privacy Policy'  },
                { href: '/en/terms-and-conditions', label: 'Terms of Use'   },
                { href: '/search',                 label: 'Search'          },
                { href: '/api/rss',                label: 'RSS Feed'        },
              ].map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[0.78rem] text-[#555] hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter CTA */}
          <div>
            <h4 className="text-[0.6rem] font-black uppercase tracking-[0.18em] text-[#444] mb-5">Stay Informed</h4>
            <p className="text-[0.78rem] text-[#555] leading-relaxed mb-4">
              Get breaking news and top stories from Cameroon delivered to your inbox.
            </p>
            <a
              href="/en/newsletter"
              className="inline-block px-5 py-2.5 bg-[#C8102E] text-white text-[0.72rem] font-black uppercase tracking-widest rounded-lg hover:bg-[#FF1F3D] transition-colors">
              Subscribe
            </a>
            <div className="mt-6">
              <p className="text-[0.6rem] font-black uppercase tracking-widest text-[#333] mb-2">Download App</p>
              <div className="flex gap-2">
                <span className="px-3 py-1.5 bg-[#111] border border-[#1E1E1E] rounded-lg text-[0.65rem] text-[#444]">iOS</span>
                <span className="px-3 py-1.5 bg-[#111] border border-[#1E1E1E] rounded-lg text-[0.65rem] text-[#444]">Android</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#1E1E1E] mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[0.65rem] text-[#333]">
            © {year} {SITE_NAME}. All Rights Reserved.
          </p>
          <p className="text-[0.65rem] text-[#2A2A2A]">
            Independent journalism since 2014
          </p>
        </div>

      </div>
    </footer>
  )
}
