import { db } from '@/lib/db/client'
import { exileSubmissions } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const STATUS_COLORS: Record<string, string> = {
  pending:   '#F5A623',
  reviewing: '#3B82F6',
  published: '#22C55E',
  rejected:  '#555',
}

export default async function ExileVoicesAdminPage() {
  const submissions = await db
    .select()
    .from(exileSubmissions)
    .orderBy(desc(exileSubmissions.createdAt))
    .limit(100)

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F0F0F0', marginBottom: '8px' }}>Exile Voices</h1>
      <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '24px' }}>{submissions.length} submissions</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {submissions.map(s => (
          <div key={s.id} style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: STATUS_COLORS[s.status ?? 'pending'], textTransform: 'uppercase' }}>
                  {s.status}
                </span>
                {s.region && <span style={{ fontSize: '0.65rem', color: '#555' }}>{s.region}</span>}
                {s.category && <span style={{ fontSize: '0.65rem', color: '#555' }}>· {s.category}</span>}
              </div>
              <span style={{ fontSize: '0.65rem', color: '#444' }}>
                {new Date(s.createdAt!).toLocaleString('en-GB')}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#C0C0C0', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
              {s.content}
            </p>
          </div>
        ))}
        {submissions.length === 0 && <p style={{ color: '#555' }}>No submissions yet.</p>}
      </div>
    </div>
  )
}
