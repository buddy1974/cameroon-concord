import { db } from '@/lib/db/client'
import { accountabilityPromises } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { SITE_URL } from '@/lib/constants'
import type { Metadata } from 'next'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Accountability Tracker — Cameroon Concord',
  description: 'Tracking promises made by Cameroonian officials against what was actually delivered.',
  alternates: { canonical: `${SITE_URL}/accountability` },
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#F5A623' },
  kept:    { label: 'Kept',    color: '#22C55E' },
  broken:  { label: 'Broken',  color: '#C8102E' },
  partial: { label: 'Partial', color: '#A855F7' },
}

export default async function AccountabilityPage() {
  const promises = await db
    .select()
    .from(accountabilityPromises)
    .orderBy(desc(accountabilityPromises.dateMade))

  const broken  = promises.filter(p => p.status === 'broken').length
  const kept    = promises.filter(p => p.status === 'kept').length
  const pending = promises.filter(p => p.status === 'pending').length
  const partial = promises.filter(p => p.status === 'partial').length

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#C8102E', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
        CC Accountability Tracker
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#F0F0F0', marginBottom: '8px', lineHeight: 1.2 }}>
        Did They Keep Their Word?
      </h1>
      <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '32px' }}>
        A live record of promises made by Cameroonian officials — and whether they delivered.
      </p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {[
          { label: 'Broken',  count: broken,  color: '#C8102E' },
          { label: 'Kept',    count: kept,    color: '#22C55E' },
          { label: 'Pending', count: pending, color: '#F5A623' },
          { label: 'Partial', count: partial, color: '#A855F7' },
        ].map(s => (
          <div key={s.label} style={{ background: '#0F0F0F', border: `1px solid ${s.color}22`, borderTop: `3px solid ${s.color}`, borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Promise list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {promises.map(p => {
          const cfg = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
          return (
            <div key={p.id} style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderLeft: `4px solid ${cfg.color}`, borderRadius: '10px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#E0E0E0' }}>{p.official}</span>
                  {p.ministry && <span style={{ fontSize: '0.68rem', color: '#555', marginLeft: '8px' }}>· {p.ministry}</span>}
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: cfg.color, background: `${cfg.color}15`, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                  {cfg.label}
                </span>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#C0C0C0', lineHeight: 1.6, marginBottom: '8px' }}>
                {p.promise}
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.65rem', color: '#444' }}>
                  Promised: {new Date(p.dateMade).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
                {p.deadline && (
                  <span style={{ fontSize: '0.65rem', color: '#444' }}>
                    Deadline: {new Date(p.deadline).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                )}
                {p.evidenceUrl && (
                  <a href={p.evidenceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.65rem', color: '#F5A623' }}>
                    Evidence →
                  </a>
                )}
              </div>
              {p.notes && (
                <p style={{ fontSize: '0.75rem', color: '#444', marginTop: '8px', fontStyle: 'italic' }}>
                  {p.notes}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '32px', padding: '16px', background: '#0A0A0A', borderRadius: '10px', fontSize: '0.75rem', color: '#444', textAlign: 'center' }}>
        Have information about a broken promise? Contact us: editor@cameroon-concord.com
      </div>
    </div>
  )
}
