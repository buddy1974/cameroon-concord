import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const revalidate = 86400

export const metadata: Metadata = {
  title:       'Editorial Policy — Cameroon Concord',
  description: 'The editorial standards, independence, corrections policy, and AI usage guidelines that govern Cameroon Concord\'s journalism.',
  alternates:  { canonical: `${SITE_URL}/editorial-policy` },
  openGraph: {
    title:       'Editorial Policy — Cameroon Concord',
    description: 'Editorial standards and independence of Cameroon Concord.',
    url:         `${SITE_URL}/editorial-policy`,
  },
}

const sections = [
  {
    heading: 'Independence',
    body: 'Cameroon Concord is an independent digital news platform founded in 2014. We are not affiliated with any political party, government body, or corporate interest. Editorial decisions are made independently of our commercial operations.',
  },
  {
    heading: 'Standards',
    body: 'We are committed to accurate, fair, and timely reporting. All articles are reviewed before publication. We clearly distinguish between news reporting, analysis, and opinion.',
  },
  {
    heading: 'Corrections',
    body: 'Cameroon Concord corrects factual errors promptly. When a significant correction is made, it is noted at the bottom of the affected article with the date of correction.',
  },
  {
    heading: 'Sources',
    body: 'We protect the identity of confidential sources. Where sources are named, we verify their credibility before publication.',
  },
  {
    heading: 'AI-Assisted Content',
    body: 'Cameroon Concord uses AI tools to assist with article drafting and enhancement. All AI-assisted content is reviewed and edited by our editorial team before publication.',
  },
  {
    heading: 'Contact',
    body: null,
    contact: 'editor@cameroon-concord.com',
  },
]

export default function EditorialPolicyPage() {
  return (
    <div style={{ paddingTop: '48px', paddingBottom: '80px', maxWidth: '720px', margin: '0 auto' }}>

      <div style={{ marginBottom: '40px' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#C8102E', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Cameroon Concord
        </span>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', margin: '8px 0 0', lineHeight: 1.1 }}>
          Editorial Policy
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
        {sections.map(s => (
          <div key={s.heading} style={{ borderLeft: '3px solid #1E1E1E', paddingLeft: '20px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#F5A623', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {s.heading}
            </h2>
            {s.body && (
              <p style={{ fontSize: '0.9rem', color: '#9CA3AF', lineHeight: 1.8, margin: 0 }}>
                {s.body}
              </p>
            )}
            {s.contact && (
              <p style={{ fontSize: '0.9rem', color: '#9CA3AF', lineHeight: 1.8, margin: 0 }}>
                Editorial queries:{' '}
                <a
                  href={`mailto:${s.contact}`}
                  style={{ color: '#C8102E', textDecoration: 'none' }}
                >
                  {s.contact}
                </a>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
