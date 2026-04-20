import { EXPLAINS } from '@/lib/explains'
import { SITE_URL }  from '@/lib/constants'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:       'CC Explains — Cameroon Concord',
  description: "Quick explainers on the biggest topics in Cameroonian politics, society and sport.",
  alternates:  { canonical: `${SITE_URL}/explains` },
}

export default function ExplainsIndexPage() {
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#C8102E', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
        CC Explains
      </div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F0F0F0', marginBottom: '8px' }}>
        Understand Cameroon
      </h1>
      <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '32px' }}>
        Quick explainers on the key topics behind the news.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {EXPLAINS.map(e => (
          <a key={e.id} href={`/explains/${e.id}`} style={{ display: 'block', padding: '16px 20px', background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '10px', textDecoration: 'none' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#C8102E', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
              {e.cards.length} cards
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#E0E0E0' }}>{e.title}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
