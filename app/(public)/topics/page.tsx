import { SITE_URL } from '@/lib/constants'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Topics — Cameroon Concord',
  description: 'Browse all Cameroon Concord topic hubs — deep coverage of the Anglophone crisis, Paul Biya, FECAFOOT, elections, and diaspora news.',
  alternates: { canonical: `${SITE_URL}/topics` },
}

const TOPICS = [
  { slug: 'anglophone-crisis',      name: 'Anglophone Crisis',  desc: 'The conflict in NW & SW Cameroon',  icon: '⚔️' },
  { slug: 'paul-biya',              name: 'Paul Biya',          desc: '43 years of one-man rule',          icon: '🏛️' },
  { slug: 'samuel-etoo-fecafoot',   name: "Eto'o & FECAFOOT",   desc: 'Football governance scandal',       icon: '⚽' },
  { slug: 'cameroon-elections-2025',name: '2025 Elections',     desc: 'The disputed presidential vote',    icon: '🗳️' },
  { slug: 'cameroon-diaspora',      name: 'Diaspora',           desc: 'Cameroonians abroad',               icon: '🌍' },
]

export default function TopicsIndexPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#C8102E', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
        Topics
      </div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F0F0F0', marginBottom: '8px' }}>
        Deep Coverage by Topic
      </h1>
      <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '32px' }}>
        All CC coverage organised by major ongoing stories.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
        {TOPICS.map(t => (
          <a key={t.slug} href={`/topics/${t.slug}`} style={{ display: 'block', padding: '20px', background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '12px', textDecoration: 'none' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{t.icon}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#E0E0E0', marginBottom: '4px' }}>{t.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#555' }}>{t.desc}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
