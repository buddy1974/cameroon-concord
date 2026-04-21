import type { Metadata } from 'next'
import { DiasporaMap } from '@/components/common/DiasporaMap'

export const metadata: Metadata = {
  title: 'About Cameroon Concord | Independent News from Cameroon',
  description: 'Cameroon Concord is an independent English-language news platform covering Cameroon and Southern Cameroons since 2014.',
}

export default function AboutPage() {
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: '40px' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8102E' }}>About Us</span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginTop: '8px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          In the Heart of Cameroon&apos;s News Pulse
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '48px' }}>
        {[
          { number: '17,722', label: 'Articles Published' },
          { number: '2014',   label: 'Founded' },
          { number: '10+',    label: 'Years of Coverage' },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#111', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#C8102E' }}>{stat.number}</div>
            <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ color: '#BBBBBB', lineHeight: 1.85, fontSize: '1.05rem' }}>
        <p style={{ marginBottom: '1.5rem' }}>
          <strong style={{ color: '#EEE' }}>Cameroon Concord</strong> is an independent English-language digital news platform
          dedicated to delivering accurate, unbiased, and timely reporting on Cameroon and Southern Cameroons.
          Founded in 2014, we have grown to become one of the most trusted sources of Cameroonian news for
          readers across Africa and in the diaspora.
        </p>
        <p style={{ marginBottom: '1.5rem' }}>
          We cover breaking news, politics, society, business, sports, health, and the ongoing
          Anglophone crisis with a commitment to journalistic integrity and editorial independence.
          Our team of reporters and contributors operates across Cameroon and internationally.
        </p>
        <p style={{ marginBottom: '1.5rem' }}>
          Cameroon Concord is not affiliated with any political party, government, or corporate interest.
          We are funded by advertising revenue and reader support. Our editorial decisions are made
          independently of our commercial operations.
        </p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F5A623', margin: '2.5rem 0 1rem' }}>Our Mission</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          To inform, educate, and empower Cameroonians at home and abroad with credible journalism
          that reflects the full diversity of the country — both Francophone and Anglophone perspectives,
          both government and opposition voices, both urban and rural stories.
        </p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F5A623', margin: '2.5rem 0 1rem' }}>Editorial Standards</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          We follow international best practices for journalism. We verify information before publishing,
          clearly label opinion content, correct errors promptly, and protect the identity of sources
          who face risk for speaking to us.
        </p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F5A623', margin: '2.5rem 0 1rem' }}>Contact the Newsroom</h2>
        <p>
          Editorial inquiries: <a href="mailto:info@cameroon-concord.com" style={{ color: '#F5A623' }}>info@cameroon-concord.com</a><br />
          Tips and press releases: <a href="mailto:tips@cameroon-concord.com" style={{ color: '#F5A623' }}>tips@cameroon-concord.com</a>
        </p>
        <DiasporaMap />
      </div>
    </div>
  )
}
