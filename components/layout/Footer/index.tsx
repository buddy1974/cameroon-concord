import Link from 'next/link'
import Image from 'next/image'
import { SITE_NAME, SITE_FB } from '@/lib/constants'

export function Footer() {
  const year = new Date().getFullYear()

  const sections = [
    {
      title: 'Sections',
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
      title: 'Coverage',
      links: [
        { href: '/anglophone-crisis',  label: 'Anglophone Crisis' },
        { href: '/tag/paul-biya',      label: 'Biya Era' },
        { href: '/headlines',          label: 'Breaking News' },
        { href: '/explains',           label: 'CC Explains' },
        { href: '/exile-voices',       label: 'Exile Voices' },
        { href: '/accountability',     label: 'Accountability' },
        { href: '/time-capsule',       label: 'Time Capsule' },
      ],
    },
    {
      title: 'The Concord',
      links: [
        { href: '/about',             label: 'About us' },
        { href: '/contact',           label: 'Contact' },
        { href: '/advertise',         label: 'Advertise' },
        { href: '/privacy',           label: 'Privacy Policy' },
        { href: '/editorial-policy',  label: 'Editorial Policy' },
        { href: '/rss',               label: 'RSS Feed' },
        { href: '/search',            label: 'Search' },
      ],
    },
  ]

  return (
    <footer style={{ borderTop: '1px solid hsl(var(--border))', marginTop: 0, background: 'hsl(var(--background))' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '64px 24px 32px' }}>

        {/* Top: Logo + tagline + socials | Advertise banner */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 40, marginBottom: 56, flexWrap: 'wrap' }}>
          {/* LEFT: logo + tagline + socials */}
          <div style={{ maxWidth: 400 }}>
            <Link href="/" aria-label="Cameroon Concord home"
              style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', marginBottom: 16 }}>
              <span style={{ background: 'hsl(210 20% 95%)', color: 'hsl(222 15% 7%)', padding: '4px 10px', fontFamily: 'var(--font-fraunces)', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.06em', lineHeight: 1.4 }}>CAMEROON</span>
              <span style={{ background: 'hsl(var(--primary))', color: '#fff', padding: '4px 10px', fontFamily: 'var(--font-fraunces)', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.06em', lineHeight: 1.4 }}>CONCORD</span>
            </Link>
            <p style={{ fontSize: '0.88rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.7, marginBottom: 20 }}>
              Cameroon Concord is the country&apos;s premier independent newsroom — delivering measured reporting, deep analysis and original storytelling from across the two Cameroons and the diaspora.
            </p>
            {/* Social links */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { href: SITE_FB, label: 'Facebook' },
                { href: 'https://twitter.com/CameroonC', label: 'Twitter/X' },
                { href: 'https://www.tiktok.com/@cameroonconcord', label: 'TikTok' },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))', padding: '8px 14px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'color 0.15s, border-color 0.15s' }}
                  className="hover:text-white hover:border-primary">
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* RIGHT: Advertise banner */}
          <Link href="/advertise" style={{ display: 'block', flexShrink: 0, borderRadius: 12, overflow: 'hidden', transition: 'opacity 0.2s' }} className="hover:opacity-90">
            <Image
              src="/advertise-banner.png"
              alt="Advertise on Cameroon Concord"
              width={480}
              height={160}
              style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
            />
          </Link>
        </div>

        {/* 3-column link grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '32px 48px', paddingBottom: 48, borderBottom: '1px solid hsl(var(--border))' }}>
          {sections.map(section => (
            <div key={section.title}>
              <h4 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 16 }}>
                {section.title}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href}
                      style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', textDecoration: 'none', transition: 'color 0.15s' }}
                      className="hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Tag cloud */}
        <div style={{ padding: '24px 0', borderBottom: '1px solid hsl(var(--border))' }}>
          <p style={{ fontSize: '0.58rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'hsl(var(--border))', marginBottom: 14 }}>Explore</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
              <Link key={tag.href} href={tag.href}
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))', padding: '5px 12px', borderRadius: 20, fontSize: '0.72rem', textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                className="hover:text-white hover:border-primary">
                {tag.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Advertise banner — right-aligned above copyright */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <a href="/advertise" style={{ display: 'block', maxWidth: '760px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
            <img
              src="/advertise-banner.png"
              alt="Advertise on Cameroon Concord"
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '12px' }}
            />
          </a>
        </div>

        {/* Bottom bar */}
        <div style={{ paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: '0.72rem', color: 'hsl(var(--border))' }}>
            © {year} {SITE_NAME}. All rights reserved. Independent journalism.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { href: '/privacy',   label: 'Privacy' },
              { href: '/advertise', label: 'Advertise' },
              { href: '/contact',   label: 'Contact' },
            ].map(link => (
              <Link key={link.href} href={link.href}
                style={{ fontSize: '0.72rem', color: 'hsl(var(--border))', textDecoration: 'none', transition: 'color 0.15s' }}
                className="hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  )
}
