import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'The Anglophone Crisis | Cameroon Concord',
  description: 'Comprehensive coverage of the Anglophone crisis in Cameroon — background, timeline, and latest news.',
}

export default function AnglophoneCrisisPage() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px' }}>
      <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8102E' }}>Special Coverage</span>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginTop: '8px', lineHeight: 1.1, marginBottom: '8px' }}>
        The Anglophone Crisis
      </h1>
      <p style={{ color: '#888', fontSize: '1rem', lineHeight: 1.7, marginBottom: '48px', maxWidth: '680px' }}>
        Since 2016, Cameroon has been torn by a conflict between the Francophone government and
        English-speaking regions of the Northwest and Southwest. Cameroon Concord has covered
        this crisis from the beginning with on-the-ground reporting.
      </p>

      {/* Key facts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '48px' }}>
        {[
          { number: '2016',  label: 'Crisis began' },
          { number: '6,000+', label: 'Lives lost' },
          { number: '700K+', label: 'Displaced' },
          { number: '8yrs+', label: 'Duration' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#C8102E' }}>{s.number}</div>
            <div style={{ fontSize: '0.65rem', color: '#555', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Background */}
      <div style={{ color: '#BBBBBB', lineHeight: 1.85, fontSize: '1rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F5A623', marginBottom: '16px' }}>Background</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          Cameroon is a bilingual country — French and English — born from the merger of French Cameroun
          and British Southern Cameroons in 1961. The English-speaking Northwest and Southwest regions
          have long complained of marginalization, with French increasingly dominating public life,
          courts, and schools in their territories.
        </p>
        <p style={{ marginBottom: '1.5rem' }}>
          In 2016, teachers and lawyers in the Anglophone regions went on strike to protest the
          appointment of French-speaking judges and teachers to their regions. The government&apos;s
          violent crackdown on protests triggered an escalation that led to an armed insurgency
          by separatist groups calling for an independent state of &quot;Ambazonia.&quot;
        </p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F5A623', margin: '2.5rem 0 1rem' }}>Our Coverage</h2>
        <p style={{ marginBottom: '2rem' }}>
          Cameroon Concord has reported on the Anglophone crisis since its inception, providing
          coverage of military operations, humanitarian conditions, political negotiations,
          and diaspora perspectives that mainstream media often overlooks.
        </p>

        <Link
          href="/southern-cameroons"
          style={{ display: 'inline-block', background: '#C8102E', color: '#fff', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}
        >
          Read All S. Cameroons Coverage →
        </Link>
      </div>
    </div>
  )
}
