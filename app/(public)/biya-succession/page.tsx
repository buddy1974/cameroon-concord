import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `Biya Succession: Who Will Lead Cameroon After Paul Biya? | ${SITE_NAME}`,
  description: 'An in-depth analysis of the power struggle, key contenders, and scenarios shaping Cameroon\'s post-Biya political future.',
  openGraph: {
    title: 'Biya Succession: Who Will Lead Cameroon After Paul Biya?',
    description: 'Analysis of power dynamics, factions, and scenarios for Cameroon\'s political transition.',
    url: `${SITE_URL}/biya-succession`,
    type: 'article',
  },
}

const CONTENDERS = [
  {
    name: 'Ferdinand Ngoh Ngoh',
    role: 'Secretary-General of the Presidency',
    probability: 72,
    color: '#C8102E',
    description: 'Biya\'s closest aide and gatekeeper. Controls access to the presidency and has quietly consolidated influence over ministries and security services. Seen as the most likely interim power broker.',
    risk: 'Lacks mass political base. Military loyalty untested.',
  },
  {
    name: 'Joseph Dion Ngute',
    role: 'Prime Minister',
    probability: 38,
    color: '#F5A623',
    description: 'Anglophone technocrat elevated during the Anglophone crisis. Represents a potential bridge candidate — acceptable to the West and moderate CPDM factions. Limited independent power base.',
    risk: 'CPDM hardliners see him as a transitional placeholder, not a successor.',
  },
  {
    name: 'Laurent Esso',
    role: 'Minister of Justice',
    probability: 31,
    color: '#3B82F6',
    description: 'Longstanding loyalist with deep ties to the judiciary and security apparatus. Elder statesman of the Biya inner circle. Has survived multiple political purges.',
    risk: 'Advanced age. No grassroots support base.',
  },
  {
    name: 'Franck Biya',
    role: 'Biya\'s Son (unofficial)',
    probability: 24,
    color: '#A855F7',
    description: 'Paul Biya\'s son has been increasingly visible at CPDM events, fuelling dynastic succession speculation. No formal political role, but loyal networks have been cultivated.',
    risk: 'Military would resist a dynastic transfer. Regional backlash likely.',
  },
  {
    name: 'Military Junta Scenario',
    role: 'Armed Forces',
    probability: 19,
    color: '#EF4444',
    description: 'West and Central Africa\'s coup wave has emboldened military actors. If the transition is chaotic, a military council — modelled on Mali or Burkina Faso — cannot be ruled out.',
    risk: 'International sanctions. Would deepen the Anglophone conflict.',
  },
]

const SCENARIOS = [
  {
    title: 'Managed CPDM Transition',
    likelihood: 'Most Likely',
    color: '#22C55E',
    body: 'The party machine orchestrates a controlled handover to an approved successor — likely from the existing inner circle. A transitional government maintains stability while factions negotiate behind closed doors. This mirrors transitions in Gabon and Togo.',
  },
  {
    title: 'Constitutional Succession',
    likelihood: 'Possible',
    color: '#F5A623',
    body: 'The President of the Senate becomes acting president per Article 6 of the constitution. Marcel Niat Njifenji (born 1933) currently holds this role, making a long-term constitutional succession unlikely. A by-election would follow within 120 days.',
  },
  {
    title: 'Military Intervention',
    likelihood: 'Unlikely but Rising',
    color: '#C8102E',
    body: 'A contested or chaotic transition could invite military action. The DGSN and BIR have their own interests. Regional precedent from Mali (2021), Burkina Faso (2022), and Niger (2023) has lowered the psychological barrier to coups in Francophone Africa.',
  },
  {
    title: 'Negotiated Federal Transition',
    likelihood: 'Opposition Hope',
    color: '#3B82F6',
    body: 'Opposition and civil society groups hope a post-Biya moment opens space for constitutional reform — including federalism or even confederation to address the Anglophone crisis. Historically, transitions in Africa rarely deliver on such aspirations without sustained pressure.',
  },
]

export default function BiyaSuccessionPage() {
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.7rem', color: '#555', marginBottom: '24px' }}>
        <Link href="/" style={{ color: '#555', textDecoration: 'none' }}>Home</Link>
        <span>›</span>
        <Link href="/politics" style={{ color: '#555', textDecoration: 'none' }}>Politics</Link>
        <span>›</span>
        <span style={{ color: '#EEE' }}>Biya Succession</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'inline-block', background: '#C8102E', color: '#fff', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', padding: '3px 10px', borderRadius: '4px', marginBottom: '16px' }}>
          CC Deep Analysis
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#F5A623', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '16px' }}>
          Who Will Lead Cameroon After Paul Biya?
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#9CA3AF', lineHeight: 1.7, marginBottom: '16px' }}>
          Paul Biya has ruled Cameroon for over four decades. At 91, the question of succession is no longer theoretical — it is the most consequential political variable in the country. Cameroon Concord maps the factions, contenders, and scenarios shaping the transition.
        </p>
        <p style={{ fontSize: '0.72rem', color: '#444' }}>
          Last updated: April 2026 · Ongoing coverage
        </p>
      </div>

      {/* Context */}
      <section style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderLeft: '4px solid #C8102E', borderRadius: '8px', padding: '20px', marginBottom: '40px' }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#C8102E', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>The Stakes</div>
        <p style={{ fontSize: '0.88rem', color: '#BBB', lineHeight: 1.75 }}>
          Cameroon is Africa&apos;s 8th largest country by area with 27 million people, an active armed conflict in two Anglophone regions, and a fragile oil-dependent economy. A disordered transition could plunge the country into a governance vacuum at the worst possible moment — with BIR forces engaged in the Northwest and Southwest, and ethnic and regional fault lines barely suppressed by four decades of authoritarian continuity.
        </p>
      </section>

      {/* Contenders */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#EEE', textTransform: 'uppercase', letterSpacing: '0.1em', borderLeft: '3px solid #C8102E', paddingLeft: '12px', marginBottom: '20px' }}>
          Key Contenders
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {CONTENDERS.map(c => (
            <div key={c.name} style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '10px', padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#EEE' }}>{c.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#555', marginTop: '2px' }}>{c.role}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: c.color }}>{c.probability}%</div>
                  <div style={{ fontSize: '0.58rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>likelihood</div>
                </div>
              </div>
              {/* Probability bar */}
              <div style={{ height: '3px', background: '#1A1A1A', borderRadius: '2px', marginBottom: '12px' }}>
                <div style={{ height: '100%', width: `${c.probability}%`, background: c.color, borderRadius: '2px' }} />
              </div>
              <p style={{ fontSize: '0.83rem', color: '#AAA', lineHeight: 1.65, marginBottom: '8px' }}>{c.description}</p>
              <div style={{ fontSize: '0.72rem', color: '#C8102E' }}>
                <strong>Risk:</strong> {c.risk}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Scenarios */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#EEE', textTransform: 'uppercase', letterSpacing: '0.1em', borderLeft: '3px solid #C8102E', paddingLeft: '12px', marginBottom: '20px' }}>
          Transition Scenarios
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          {SCENARIOS.map(s => (
            <div key={s.title} style={{ background: '#0F0F0F', border: `1px solid ${s.color}30`, borderTop: `3px solid ${s.color}`, borderRadius: '10px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#EEE' }}>{s.title}</div>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, color: s.color, background: `${s.color}18`, padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                  {s.likelihood}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#888', lineHeight: 1.65 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div style={{ borderTop: '1px solid #1A1A1A', paddingTop: '24px' }}>
        <p style={{ fontSize: '0.72rem', color: '#444', lineHeight: 1.7 }}>
          Probability estimates are editorial assessments based on publicly available information, regional precedent, and sourced reporting. They are not predictive models. Cameroon Concord is an independent news outlet with no political affiliation.{' '}
          <Link href="/editorial-policy" style={{ color: '#F5A623', textDecoration: 'underline' }}>Editorial Policy</Link>
        </p>
        <div style={{ marginTop: '16px' }}>
          <Link href="/politics" style={{ fontSize: '0.75rem', color: '#F5A623', textDecoration: 'none', border: '1px solid #F5A62340', padding: '8px 16px', borderRadius: '8px' }}>
            ← All Politics Coverage
          </Link>
        </div>
      </div>

    </div>
  )
}
