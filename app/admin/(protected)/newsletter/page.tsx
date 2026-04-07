'use client'
import { useState, useEffect } from 'react'

const TEMPLATES = [
  { id: 'breaking', label: '🔴 Breaking News', desc: 'Single urgent story' },
  { id: 'digest', label: '📰 Daily Digest', desc: '3-5 top stories' },
  { id: 'weekly', label: '📅 Weekly Roundup', desc: 'Best of the week' },
  { id: 'most_read', label: '🔥 Most Read', desc: 'Top articles by views' },
]

const CATEGORIES = [
  { slug: '', name: 'All Categories' },
  { slug: 'headlines', name: 'Headlines' },
  { slug: 'politics', name: 'Politics' },
  { slug: 'society', name: 'Society' },
  { slug: 'southern-cameroons', name: 'S. Cameroons' },
  { slug: 'health', name: 'Health' },
  { slug: 'business', name: 'Business' },
  { slug: 'sportsnews', name: 'Sports' },
  { slug: 'lifestyle', name: 'Lifestyle' },
]

type Article = {
  id: number; title: string; slug: string; excerpt: string;
  featuredImage?: string; catSlug: string; catName: string;
}

export default function NewsletterComposer() {
  const [template, setTemplate] = useState('digest')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [articles, setArticles] = useState<Article[]>([])
  const [selected, setSelected] = useState<Article[]>([])
  const [subject, setSubject] = useState('')
  const [preview, setPreview] = useState('')
  const [intro, setIntro] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')
  const [subCount, setSubCount] = useState(0)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => { loadArticles() }, [search, category, template])
  useEffect(() => { loadSubCount() }, [])

  async function loadSubCount() {
    const res = await fetch('/api/admin/newsletter/subscribers', { credentials: 'include' })
    const data = await res.json()
    setSubCount(data.count || 0)
  }

  async function loadArticles() {
    const params = new URLSearchParams({ search, category, type: template === 'most_read' ? 'most_read' : '' })
    const res = await fetch(`/api/admin/newsletter/articles?${params}`, { credentials: 'include' })
    const data = await res.json()
    setArticles(Array.isArray(data) ? data : [])
  }

  function toggleSelect(a: Article) {
    setSelected(s => s.find(x => x.id === a.id) ? s.filter(x => x.id !== a.id) : [...s, a])
  }

  async function generateAI() {
    if (selected.length === 0) return setMsg('Select at least one article first.')
    setGenerating(true)
    const res = await fetch('/api/admin/newsletter/generate', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles: selected, template })
    })
    const data = await res.json()
    setSubject(data.subject || '')
    setPreview(data.preview || '')
    setIntro(data.intro || '')
    setGenerating(false)
  }

  function buildHtml() {
    const SITE = 'https://www.cameroon-concord.com'
    const articleCards = selected.map(a => `
      <tr><td style="padding:0 0 24px">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${a.featuredImage ? `<tr><td><img src="${a.featuredImage}" width="100%" style="border-radius:6px;margin-bottom:12px" /></td></tr>` : ''}
          <tr><td>
            <span style="background:#C8102E;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:3px;text-transform:uppercase">${a.catName}</span>
          </td></tr>
          <tr><td style="padding:8px 0 6px">
            <a href="${SITE}/${a.catSlug}/${a.slug}" style="color:#fff;font-size:18px;font-weight:700;text-decoration:none;line-height:1.3">${a.title}</a>
          </td></tr>
          <tr><td style="color:#999;font-size:14px;line-height:1.6;padding-bottom:10px">${a.excerpt || ''}</td></tr>
          <tr><td>
            <a href="${SITE}/${a.catSlug}/${a.slug}" style="background:#C8102E;color:#fff;padding:8px 18px;border-radius:4px;text-decoration:none;font-size:13px;font-weight:700">Read Full Story →</a>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="border-top:1px solid #222;padding-bottom:24px"></td></tr>
    `).join('')

    return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#111;font-family:Arial,sans-serif">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#111">
        <tr><td align="center" style="padding:20px">
          <table width="600" cellpadding="0" cellspacing="0">
            <tr><td style="background:#C8102E;padding:20px 24px;border-radius:8px 8px 0 0">
              <a href="${SITE}" style="color:#fff;font-size:22px;font-weight:900;text-decoration:none">CAMEROON CONCORD</a>
              <span style="color:rgba(255,255,255,0.7);font-size:12px;display:block;margin-top:2px">Independent Cameroon News</span>
            </td></tr>
            <tr><td style="background:#1a1a1a;padding:24px;border-radius:0 0 8px 8px">
              ${intro ? `<p style="color:#ccc;font-size:15px;line-height:1.6;margin:0 0 24px;padding-bottom:24px;border-bottom:1px solid #333">${intro}</p>` : ''}
              <table width="100%" cellpadding="0" cellspacing="0">${articleCards}</table>
              <p style="color:#555;font-size:12px;text-align:center;margin-top:24px;padding-top:24px;border-top:1px solid #222">
                © ${new Date().getFullYear()} Cameroon Concord ·
                <a href="{{UNSUBSCRIBE_URL}}" style="color:#C8102E">Unsubscribe</a>
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>`
  }

  async function send() {
    if (!subject) return setMsg('Generate or write a subject line first.')
    if (selected.length === 0) return setMsg('Select at least one article.')
    if (subCount === 0) return setMsg('No confirmed subscribers yet.')
    if (!confirm(`Send to ${subCount} subscriber(s)?`)) return
    setSending(true)
    const res = await fetch('/api/admin/newsletter/send', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, preview, htmlBody: buildHtml() })
    })
    const data = await res.json()
    setSending(false)
    setMsg(data.success ? `✅ Sent to ${data.sent} subscriber(s)!` : `❌ ${data.error}`)
  }

  return (
    <div style={{ padding: '24px', color: '#fff', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>📬 Newsletter Composer</h1>
        <div style={{ background: '#1a1a1a', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem' }}>
          <span style={{ color: '#666' }}>Subscribers: </span>
          <span style={{ color: '#C8102E', fontWeight: 700 }}>{subCount}</span>
        </div>
      </div>

      {msg && <div style={{ padding: '12px 16px', background: msg.startsWith('✅') ? '#0a2a0a' : '#2a0a0a', border: `1px solid ${msg.startsWith('✅') ? '#007A3D' : '#C8102E'}`, borderRadius: '6px', marginBottom: '16px', fontSize: '0.9rem' }}>{msg}</div>}

      {/* Template picker */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ color: '#666', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Template</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => setTemplate(t.id)} style={{
              padding: '10px 16px', borderRadius: '8px', border: `1px solid ${template === t.id ? '#C8102E' : '#333'}`,
              background: template === t.id ? '#1a0000' : '#111', color: '#fff', cursor: 'pointer', textAlign: 'left'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{t.label}</div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Article selector */}
        <div>
          <div style={{ color: '#666', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Articles</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{ background: '#111', border: '1px solid #333', borderRadius: '6px', padding: '8px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}>
              {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #222', borderRadius: '8px' }}>
            {articles.map(a => {
              const isSelected = selected.some(x => x.id === a.id)
              return (
                <div key={a.id} onClick={() => toggleSelect(a)} style={{
                  padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #1a1a1a',
                  background: isSelected ? '#1a0000' : 'transparent',
                  borderLeft: isSelected ? '3px solid #C8102E' : '3px solid transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    {a.featuredImage && <img src={a.featuredImage} style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} alt="" />}
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 400, color: isSelected ? '#fff' : '#ccc', lineHeight: 1.3 }}>{a.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#C8102E', marginTop: '2px' }}>{a.catName}</div>
                    </div>
                    {isSelected && <span style={{ marginLeft: 'auto', color: '#C8102E', flexShrink: 0 }}>✓</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Composer */}
        <div>
          <div style={{ color: '#666', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Selected: {selected.length} article{selected.length !== 1 ? 's' : ''}
          </div>

          {selected.length > 0 && (
            <div style={{ marginBottom: '12px', border: '1px solid #222', borderRadius: '8px', padding: '10px' }}>
              {selected.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: i < selected.length-1 ? '1px solid #1a1a1a' : 'none' }}>
                  <span style={{ fontSize: '0.8rem', color: '#ccc' }}>{i+1}. {a.title.slice(0, 50)}...</span>
                  <button onClick={() => toggleSelect(a)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                </div>
              ))}
            </div>
          )}

          <button onClick={generateAI} disabled={generating || selected.length === 0} style={{
            width: '100%', background: generating ? '#333' : '#1a0a2e', border: '1px solid #6b21a8',
            color: '#c084fc', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, marginBottom: '16px', fontSize: '0.9rem'
          }}>
            {generating ? '⚡ Generating...' : '✨ Generate with AI'}
          </button>

          <div style={{ marginBottom: '10px' }}>
            <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '4px' }}>Subject line</div>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject..."
              style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: '6px', padding: '9px 12px', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '4px' }}>Preview text</div>
            <input value={preview} onChange={e => setPreview(e.target.value)} placeholder="Email preview text..."
              style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: '6px', padding: '9px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '4px' }}>Intro paragraph</div>
            <textarea value={intro} onChange={e => setIntro(e.target.value)} rows={3} placeholder="Opening paragraph..."
              style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: '6px', padding: '9px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowPreview(!showPreview)} style={{
              flex: 1, background: '#111', border: '1px solid #333', color: '#ccc',
              padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem'
            }}>
              {showPreview ? 'Hide Preview' : '👁 Preview Email'}
            </button>
            <button onClick={send} disabled={sending || subCount === 0} style={{
              flex: 1, background: subCount === 0 ? '#333' : '#C8102E', color: '#fff', border: 'none',
              padding: '10px', borderRadius: '8px', cursor: sending || subCount === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '0.9rem'
            }}>
              {sending ? 'Sending...' : `🚀 Send to ${subCount}`}
            </button>
          </div>
        </div>
      </div>

      {showPreview && selected.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ color: '#666', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase' }}>Email Preview</div>
          <div style={{ border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
            <iframe srcDoc={buildHtml()} style={{ width: '100%', height: '600px', border: 'none' }} />
          </div>
        </div>
      )}
    </div>
  )
}
