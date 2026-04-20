import { EXPLAINS } from '@/lib/explains'
import { notFound }  from 'next/navigation'
import { SITE_URL }  from '@/lib/constants'

export async function generateStaticParams() {
  return EXPLAINS.map(e => ({ id: e.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id }    = await params
  const explain   = EXPLAINS.find(e => e.id === id)
  if (!explain) return {}
  return {
    title:       `${explain.title} — CC Explains | Cameroon Concord`,
    description: `Quick explainer: ${explain.title}. Understand the context behind Cameroon's biggest stories.`,
    alternates:  { canonical: `${SITE_URL}/explains/${id}` },
  }
}

export default async function ExplainsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = await params
  const explain = EXPLAINS.find(e => e.id === id)
  if (!explain) notFound()

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#C8102E', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
        CC Explains
      </div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F0F0F0', marginBottom: '32px', lineHeight: 1.2 }}>
        {explain.title}
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {explain.cards.map((card, i) => (
          <div key={i} style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderLeft: '4px solid #C8102E', borderRadius: '10px', padding: '20px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#C8102E', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {String(i + 1).padStart(2, '0')} — {card.heading}
            </div>
            <p style={{ fontSize: '0.95rem', color: '#C0C0C0', lineHeight: 1.7, margin: 0 }}>
              {card.body}
            </p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '32px', padding: '16px', background: '#0A0A0A', borderRadius: '10px', textAlign: 'center' }}>
        <a href="/" style={{ fontSize: '0.78rem', color: '#F5A623', textDecoration: 'none' }}>
          ← Back to Cameroon Concord
        </a>
      </div>
    </div>
  )
}
