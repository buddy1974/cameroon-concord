import { db } from '@/lib/db/client'
import { articles, categories, articleHits, comments } from '@/lib/db/schema'
import { desc, eq, sql } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  /* ── Core stats ── */
  const [[totalArticles], [published], [drafts]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(articles),
    db.select({ count: sql<number>`count(*)` }).from(articles).where(eq(articles.status, 'published')),
    db.select({ count: sql<number>`count(*)` }).from(articles).where(eq(articles.status, 'draft')),
  ])

  /* ── Pending comments ── */
  let pendingComments = 0
  try {
    const [row] = await db.select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(eq(comments.status, 'pending'))
    pendingComments = Number(row?.count ?? 0)
  } catch { /* comments table may differ */ }

  /* ── Drafts list ── */
  const draftsList = await db
    .select({ id: articles.id, title: articles.title, slug: articles.slug, catName: categories.name, catSlug: categories.slug, updatedAt: articles.updatedAt })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .where(eq(articles.status, 'draft'))
    .orderBy(desc(articles.updatedAt))
    .limit(8)

  /* ── Recent published ── */
  const recent = await db
    .select({ id: articles.id, title: articles.title, status: articles.status, publishedAt: articles.publishedAt, catName: categories.name, catSlug: categories.slug, slug: articles.slug, isBreaking: articles.isBreaking })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .orderBy(desc(articles.publishedAt))
    .limit(12)

  /* ── Top articles ── */
  const topArticles = await db
    .select({ id: articles.id, title: articles.title, slug: articles.slug, hits: articleHits.hits, catSlug: categories.slug })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(articleHits, eq(articles.id, articleHits.articleId))
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articleHits.hits))
    .limit(8)

  /* ── Category stats ── */
  const categoryStats = await db
    .select({
      category:     categories.name,
      slug:         categories.slug,
      totalHits:    sql<number>`COALESCE(SUM(${articleHits.hits}), 0)`,
      articleCount: sql<number>`COUNT(${articles.id})`,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(articleHits, eq(articles.id, articleHits.articleId))
    .where(eq(articles.status, 'published'))
    .groupBy(categories.id, categories.name, categories.slug)
    .orderBy(desc(sql`SUM(${articleHits.hits})`))
    .limit(8)

  /* ── PWA stats ── */
  let pwaStats = { click: 0, accepted: 0, installed: 0 }
  try {
    const rows = await db.execute(sql`SELECT event, COUNT(*) as count FROM pwa_events GROUP BY event`) as any
    const data = Array.isArray(rows) ? rows : rows?.rows ?? []
    for (const r of data) if (r.event in pwaStats) pwaStats[r.event as keyof typeof pwaStats] = Number(r.count)
  } catch {}

  /* ── Helpers ── */
  const draftCount     = Number(drafts.count)
  const publishedCount = Number(published.count)
  const totalCount     = Number(totalArticles.count)

  function timeAgo(d: Date | string | null): string {
    if (!d) return '—'
    const diff = Date.now() - new Date(d).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)   return 'just now'
    if (m < 60)  return `${m}m ago`
    if (m < 1440) return `${Math.floor(m / 60)}h ago`
    return `${Math.floor(m / 1440)}d ago`
  }

  return (
    <div style={{ maxWidth: 1100 }}>

      {/* ══════════════════════════════════════════
          HERO ACTION ROW — the first thing you see
      ══════════════════════════════════════════ */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ marginBottom: 14 }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', margin: 0 }}>Good day, Editor</h1>
          <p style={{ color: '#333', fontSize: '0.72rem', marginTop: 3 }}>Cameroon Concord · CMS Dashboard</p>
        </div>

        {/* ─ Primary action buttons ─ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Link href="/admin/quick-publish" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: 'linear-gradient(135deg, #C8102E 0%, #8B0000 100%)',
            color: '#fff', padding: '18px 20px', borderRadius: 14,
            fontWeight: 900, fontSize: '1rem', letterSpacing: '0.04em',
            textDecoration: 'none', textTransform: 'uppercase',
            boxShadow: '0 4px 20px rgba(200,16,46,0.4)',
          }}>
            <span style={{ fontSize: '1.4rem' }}>⚡</span>
            Quick Publish
          </Link>
          <Link href="/admin/articles/new" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: '#111', border: '1px solid #2A2A2A',
            color: '#ddd', padding: '18px 20px', borderRadius: 14,
            fontWeight: 800, fontSize: '0.95rem',
            textDecoration: 'none',
          }}>
            <span style={{ fontSize: '1.3rem' }}>✏️</span>
            New Article
          </Link>
        </div>

        {/* ─ Secondary quick links ─ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { href: '/admin/articles?status=draft', label: `📝 Drafts`, value: draftCount, color: '#A855F7' },
            { href: '/admin/comments',              label: '💬 Comments', value: pendingComments || '—', color: '#3B82F6' },
            { href: '/admin/newsletter',            label: '📬 Newsletter', value: null, color: '#F5A623' },
          ].map(b => (
            <Link key={b.href} href={b.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 2, padding: '12px 8px', borderRadius: 12,
              background: '#0D0D0D', border: `1px solid #1A1A1A`,
              textDecoration: 'none', color: b.color,
              fontWeight: 700, fontSize: '0.75rem', textAlign: 'center',
            }}>
              {b.value !== null && <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{b.value}</span>}
              <span>{b.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          STATS ROW
      ══════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }} className="cc-stats-grid">
        {[
          { label: 'Total',     value: totalCount,     color: '#F5A623', href: '/admin/articles'              },
          { label: 'Published', value: publishedCount, color: '#22C55E', href: '/admin/articles'              },
          { label: 'Drafts',    value: draftCount,     color: '#A855F7', href: '/admin/articles?status=draft' },
          { label: 'Installed', value: pwaStats.installed, color: '#3B82F6', href: '#'                        },
        ].map(s => (
          <Link key={s.label} href={s.href} style={{
            display: 'block', textDecoration: 'none',
            background: '#0D0D0D', border: '1px solid #1A1A1A',
            borderTop: `3px solid ${s.color}`,
            borderRadius: 12, padding: '16px 14px',
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value.toLocaleString()}</div>
            <div style={{ fontSize: '0.62rem', color: '#444', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
          </Link>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          TWO-COLUMN: DRAFTS + RECENT
      ══════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }} className="cc-two-col">

        {/* DRAFTS */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#A855F7', textTransform: 'uppercase', letterSpacing: '0.15em', borderLeft: '3px solid #A855F7', paddingLeft: 8 }}>
              📝 Drafts ({draftCount})
            </span>
            <Link href="/admin/articles?status=draft" style={{ fontSize: '0.65rem', color: '#333', textDecoration: 'none' }}>See all →</Link>
          </div>
          {draftsList.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#2A2A2A', fontSize: '0.8rem' }}>No drafts</div>
          ) : draftsList.map(a => (
            <Link key={a.id} href={`/admin/articles/${a.id}/edit`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 16px', borderBottom: '1px solid #0A0A0A',
              textDecoration: 'none',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{a.title}</div>
                <div style={{ fontSize: '0.6rem', color: '#333', marginTop: 2 }}>{a.catName} · {timeAgo(a.updatedAt)}</div>
              </div>
              <span style={{
                background: '#C8102E', color: '#fff', fontSize: '0.6rem', fontWeight: 800,
                padding: '4px 10px', borderRadius: 6, flexShrink: 0, marginLeft: 8,
                letterSpacing: '0.04em',
              }}>EDIT →</span>
            </Link>
          ))}
        </div>

        {/* RECENT PUBLISHED */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.15em', borderLeft: '3px solid #22C55E', paddingLeft: 8 }}>
              📰 Recent Published
            </span>
            <Link href="/admin/articles" style={{ fontSize: '0.65rem', color: '#333', textDecoration: 'none' }}>See all →</Link>
          </div>
          {recent.map(a => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 16px', borderBottom: '1px solid #0A0A0A',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  {a.isBreaking && (
                    <span style={{ fontSize: '0.48rem', background: '#C8102E', color: '#fff', padding: '1px 5px', borderRadius: 3, fontWeight: 900, letterSpacing: '0.1em' }}>BREAKING</span>
                  )}
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#bbb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 }}>{a.title}</div>
                </div>
                <div style={{ fontSize: '0.6rem', color: '#333' }}>{a.catName} · {timeAgo(a.publishedAt)}</div>
              </div>
              <div style={{ display: 'flex', gap: 5, flexShrink: 0, marginLeft: 8 }}>
                <Link href={`/admin/articles/${a.id}/edit`} style={{ fontSize: '0.6rem', background: '#181818', color: '#777', padding: '4px 8px', borderRadius: 5, textDecoration: 'none', border: '1px solid #222' }}>Edit</Link>
                <Link href={`/${a.catSlug}/${a.slug}`} target="_blank" style={{ fontSize: '0.6rem', background: '#181818', color: '#777', padding: '4px 8px', borderRadius: 5, textDecoration: 'none', border: '1px solid #222' }}>↗</Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          TOP ARTICLES (traffic)
      ══════════════════════════════════════════ */}
      <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, overflow: 'hidden', marginBottom: 28 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #111' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#F5A623', textTransform: 'uppercase', letterSpacing: '0.15em', borderLeft: '3px solid #F5A623', paddingLeft: 8 }}>
            📈 Top Stories by Reads
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #111' }}>
                {['#', 'Title', 'Reads', ''].map(h => (
                  <th key={h} style={{ padding: '8px 14px', textAlign: h === 'Reads' || h === '' ? 'right' : 'left', fontSize: '0.55rem', fontWeight: 700, color: '#2A2A2A', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topArticles.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #080808' }}>
                  <td style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#2A2A2A', fontWeight: 900, fontFamily: 'monospace', width: 30 }}>{String(i + 1).padStart(2, '0')}</td>
                  <td style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#bbb', maxWidth: 400 }}>
                    <a href={`/${a.catSlug}/${a.slug}`} target="_blank" style={{ color: 'inherit', textDecoration: 'none' }}>{a.title}</a>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#F5A623', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>{(a.hits || 0).toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <Link href={`/admin/articles/${a.id}/edit`} style={{ fontSize: '0.6rem', background: '#181818', color: '#555', padding: '4px 10px', borderRadius: 5, textDecoration: 'none', border: '1px solid #1E1E1E' }}>Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          CATEGORY PERFORMANCE
      ══════════════════════════════════════════ */}
      <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, overflow: 'hidden', marginBottom: 28 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #111' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.15em', borderLeft: '3px solid #3B82F6', paddingLeft: 8 }}>
            📁 Category Performance
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 1 }}>
          {categoryStats.map((c, i) => {
            const maxHits = Number(categoryStats[0]?.totalHits ?? 1) || 1
            const pct     = Math.round((Number(c.totalHits) / maxHits) * 100)
            const colors  = ['#C8102E','#F5A623','#22C55E','#3B82F6','#A855F7','#F97316','#06B6D4','#EC4899']
            const color   = colors[i % colors.length]
            return (
              <div key={c.slug} style={{ padding: '14px 16px', borderBottom: '1px solid #080808' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#bbb' }}>{c.category}</span>
                  <span style={{ fontSize: '0.65rem', color: color, fontWeight: 900 }}>{Number(c.totalHits).toLocaleString()}</span>
                </div>
                <div style={{ height: 3, background: '#111', borderRadius: 2 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: '0.55rem', color: '#2A2A2A', marginTop: 4 }}>{Number(c.articleCount)} articles</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          WHAT'S MISSING IN YOUR ADMIN
          (Pro tip panel — features to add)
      ══════════════════════════════════════════ */}
      <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: '16px 20px', marginBottom: 28 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#F5A623', textTransform: 'uppercase', letterSpacing: '0.15em', borderLeft: '3px solid #F5A623', paddingLeft: 8, marginBottom: 14 }}>
          🔧 Pro Features — Backlog
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {[
            { label: 'Media Library',          desc: 'Upload & reuse images from a central library', done: false },
            { label: 'Content Calendar',        desc: 'Schedule articles & see what publishes when',  done: false },
            { label: 'SEO Health Score',        desc: 'Per-article meta completeness & score',        done: false },
            { label: 'Push Notification Send',  desc: 'Manually push breaking news to PWA users',     done: false },
            { label: 'Google Analytics embed',  desc: 'Live traffic inside the dashboard',            done: false },
            { label: 'Author Management',       desc: 'Add/edit author profiles & avatars',           done: false },
            { label: 'Social Auto-Poster log',  desc: 'See FB/Twitter post history per article',       done: true  },
            { label: 'Comments moderation queue',desc:'Flag spam, approve pending comments',           done: true  },
          ].map(f => (
            <div key={f.label} style={{ padding: '10px 12px', background: '#080808', border: `1px solid ${f.done ? '#1A2A1A' : '#1A1A1A'}`, borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: '0.6rem', color: f.done ? '#22C55E' : '#555' }}>{f.done ? '✓' : '○'}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: f.done ? '#22C55E' : '#888' }}>{f.label}</span>
              </div>
              <div style={{ fontSize: '0.62rem', color: '#2A2A2A', lineHeight: 1.4 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Responsive CSS for this page */}
      <style>{`
        @media (max-width: 640px) {
          .cc-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .cc-two-col    { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
