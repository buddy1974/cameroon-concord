import Link from 'next/link'
import Image from 'next/image'
import { SITE_NAME, SITE_FB } from '@/lib/constants'

export function Footer() {
  const year = new Date().getFullYear()

  const sections = [
    {
      title: 'Topics',
      links: [
        { href: '/politics',           label: 'Politics' },
        { href: '/society',            label: 'Society' },
        { href: '/sportsnews',         label: 'Sports' },
        { href: '/southern-cameroons', label: 'S. Cameroons' },
        { href: '/health',             label: 'Health' },
        { href: '/business',           label: 'Business' },
        { href: '/editorial',          label: 'Editorial' },
      ],
    },
    {
      title: 'Special Coverage',
      links: [
        { href: '/anglophone-crisis',  label: 'Anglophone Crisis' },
        { href: '/tag/paul-biya',      label: 'Biya Era' },
        { href: '/headlines',          label: 'Breaking News' },
        { href: '/southern-cameroons', label: 'Ambazonia' },
        { href: '/society',            label: 'Local News' },
      ],
    },
    {
      title: 'Company',
      links: [
        { href: '/explains',          label: 'CC Explains' },
        { href: '/about',             label: 'About Us' },
        { href: '/contact',           label: 'Contact' },
        { href: '/advertise',         label: 'Advertise' },
        { href: '/privacy',           label: 'Privacy Policy' },
        { href: '/editorial-policy',  label: 'Editorial Policy' },
        { href: '/topics',            label: 'Topics' },
        { href: '/time-capsule',      label: 'Time Capsule' },
        { href: '/accountability',    label: 'Accountability Tracker' },
        { href: '/rss',               label: 'RSS Feed' },
        { href: '/search',            label: 'Search' },
      ],
    },
  ]

  return (
    <footer style={{ borderTop: '1px solid #1A1A1A', marginTop: '60px', background: '#080808' }}>

      {/* Main footer grid */}
      <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px' }}>

          {/* Brand column */}
          <div>
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <Image src="/logo.png" alt="Cameroon Concord" width={160} height={40} />
            </Link>
            <p style={{ color: '#444', fontSize: '0.8rem', marginTop: '12px', lineHeight: 1.7, maxWidth: '240px' }}>
              Independent English-language news covering Cameroon and Southern Cameroons since 2014.
            </p>

            {/* Social links */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <a href={SITE_FB} target="_blank" rel="noopener noreferrer"
                className="hover:text-[#EEE] transition-colors"
                style={{ background: '#111', border: '1px solid #1E1E1E', color: '#888', padding: '8px 14px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Facebook
              </a>
              <a href="https://twitter.com/CameroonC" target="_blank" rel="noopener noreferrer"
                className="hover:text-[#EEE] transition-colors"
                style={{ background: '#111', border: '1px solid #1E1E1E', color: '#888', padding: '8px 14px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Twitter/X
              </a>
            </div>

            {/* Newsletter CTA */}
            <div style={{ marginTop: '24px', background: '#111', border: '1px solid #1E1E1E', borderRadius: '10px', padding: '16px' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#EEE', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Newsletter</p>
              <p style={{ fontSize: '0.72rem', color: '#555', marginBottom: '12px', lineHeight: 1.5 }}>Cameroon news in your inbox</p>
              <a href="mailto:info@cameroon-concord.com?subject=Newsletter Subscription"
                style={{ display: 'block', background: '#C8102E', color: '#fff', padding: '8px 14px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, textDecoration: 'none', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Subscribe
              </a>
            </div>
          </div>

          {/* Link sections */}
          {sections.map(section => (
            <div key={section.title}>
              <p style={{ fontSize: '0.58rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2A2A2A', marginBottom: '16px' }}>
                {section.title}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {section.links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-[#EEE] transition-colors"
                      style={{ fontSize: '0.82rem', color: '#555', textDecoration: 'none' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>
      </div>

      {/* Explore / tag cloud */}
      <div style={{ borderTop: '1px solid #111' }}>
        <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '24px' }}>
          <p style={{ fontSize: '0.58rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2A2A2A', marginBottom: '16px' }}>
            Explore
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: 'Paul Biya',          href: '/tag/paul-biya' },
              { label: 'Anglophone Crisis',  href: '/tag/anglophone-crisis' },
              { label: 'AFCON',              href: '/tag/afcon' },
              { label: 'Ambazonia',          href: '/tag/ambazonia' },
              { label: 'Douala',             href: '/tag/douala' },
              { label: 'Yaoundé',            href: '/tag/yaounde' },
              { label: 'Southern Cameroons', href: '/tag/southern-cameroons' },
              { label: 'Indomitable Lions',  href: '/tag/indomitable-lions' },
              { label: 'Cameroon Economy',   href: '/tag/cameroon-economy' },
              { label: 'African Politics',   href: '/tag/african-politics' },
            ].map(tag => (
              <Link
                key={tag.href}
                href={tag.href}
                className="hover:text-[#EEE] hover:border-[#333] transition-colors"
                style={{ background: '#111', border: '1px solid #1E1E1E', color: '#555', padding: '6px 12px', borderRadius: '20px', fontSize: '0.72rem', textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                {tag.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid #0E0E0E' }}>
        <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <p style={{ fontSize: '0.65rem', color: '#2A2A2A' }}>
            © {year} {SITE_NAME}. All Rights Reserved.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            {[
              { href: '/privacy',   label: 'Privacy' },
              { href: '/advertise', label: 'Advertise' },
              { href: '/contact',   label: 'Contact' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-[#666] transition-colors"
                style={{ fontSize: '0.65rem', color: '#2A2A2A', textDecoration: 'none' }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

    </footer>
  )
}
