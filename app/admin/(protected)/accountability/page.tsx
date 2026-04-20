import { db } from '@/lib/db/client'
import { accountabilityPromises } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  pending: '#F5A623',
  kept:    '#22C55E',
  broken:  '#C8102E',
  partial: '#A855F7',
}

export default async function AdminAccountabilityPage() {
  const promises = await db
    .select()
    .from(accountabilityPromises)
    .orderBy(desc(accountabilityPromises.dateMade))

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F0F0F0' }}>Accountability Tracker</h1>
          <p style={{ fontSize: '0.78rem', color: '#555', marginTop: '4px' }}>{promises.length} promises on record</p>
        </div>
        <Link
          href="/accountability"
          target="_blank"
          style={{ fontSize: '0.72rem', color: '#F5A623', background: '#1A1A1A', border: '1px solid #2A2A2A', padding: '8px 14px', borderRadius: '8px', textDecoration: 'none' }}
        >
          View Public Page →
        </Link>
      </div>

      <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1A1A1A' }}>
              {['Official', 'Ministry', 'Promise', 'Date Made', 'Deadline', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.6rem', fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {promises.map((p, i) => {
              const color = STATUS_COLORS[p.status ?? 'pending'] ?? '#F5A623'
              return (
                <tr key={p.id} style={{ borderBottom: i < promises.length - 1 ? '1px solid #141414' : 'none' }}>
                  <td style={{ padding: '14px 16px', color: '#E0E0E0', fontWeight: 600, whiteSpace: 'nowrap' }}>{p.official}</td>
                  <td style={{ padding: '14px 16px', color: '#555', whiteSpace: 'nowrap' }}>{p.ministry ?? '—'}</td>
                  <td style={{ padding: '14px 16px', color: '#AAA', maxWidth: '340px' }}>{p.promise}</td>
                  <td style={{ padding: '14px 16px', color: '#555', whiteSpace: 'nowrap' }}>
                    {new Date(p.dateMade).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#555', whiteSpace: 'nowrap' }}>
                    {p.deadline ? new Date(p.deadline).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color, background: `${color}18`, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {p.status ?? 'pending'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
