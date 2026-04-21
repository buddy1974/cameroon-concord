'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Category, Article, ArticleStatus } from '@/lib/types'

interface Props {
  categories: Category[]
  article?:   Article
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const COUNTRY_GROUPS = [
  { label: 'Central Africa', items: ['Cameroon', 'Chad', 'CAR', 'Gabon', 'Equatorial Guinea', 'Congo (Brazzaville)', 'Congo (DRC)'] },
  { label: 'West Africa',    items: ['Nigeria', 'Ghana', 'Senegal', 'Mali', 'Guinea', 'Sierra Leone', 'Liberia', 'Burkina Faso', 'Niger', 'Benin', 'Togo', 'Côte d\'Ivoire', 'Guinea-Bissau', 'Gambia'] },
  { label: 'East Africa',    items: ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Ethiopia'] },
  { label: 'Southern Africa',items: ['South Africa'] },
  { label: 'Diaspora',       items: ['Diaspora', 'USA', 'France', 'Germany', 'United Kingdom', 'Canada', 'Europe', 'International'] },
]

const CC_AUTHORS = [
  { id: 3,  name: 'Nkemdirim Tabi' },
  { id: 4,  name: 'Ebot Ayuk' },
  { id: 5,  name: 'Cynthia Mbah' },
  { id: 6,  name: 'Fidelis Ngong' },
  { id: 7,  name: 'Solange Achu' },
  { id: 8,  name: 'Emeka Tambe' },
  { id: 9,  name: 'Bridget Forjindam' },
  { id: 10, name: 'Ndong Eyong' },
]

export function ArticleEditor({ categories, article }: Props) {
  const router = useRouter()
  const isEdit = !!article

  const [title,     setTitle]     = useState(article?.title || '')
  const [slug,      setSlug]      = useState(article?.slug || '')
  const [body,      setBody]      = useState(article?.body || '')
  const [excerpt,   setExcerpt]   = useState(article?.excerpt || '')
  const [catId,     setCatId]     = useState<number>(article?.categoryId || categories[0]?.id || 0)
  const [imgUrl,    setImgUrl]    = useState(article?.featuredImage || '')
  const [status,    setStatus]    = useState(article?.status || 'draft')
  const [breaking,  setBreaking]  = useState(article?.isBreaking || false)
  const [featured,  setFeatured]  = useState(article?.isFeatured || false)
  const [isLive,    setIsLive]    = useState(!!(article as Record<string, unknown>)?.isLive)
  const [metaT,     setMetaT]     = useState(article?.metaTitle || '')
  const [metaD,     setMetaD]     = useState(article?.metaDesc || '')
  const [authorId,  setAuthorId]  = useState<number|null>(article?.authorId ?? null)
  const [authorName, setAuthorName] = useState<string>('')
  const [saving,    setSaving]    = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [msg,       setMsg]       = useState('')
  const [countryTags,  setCountryTags]  = useState<string[]>((article as Record<string, unknown>)?.countryTags as string[] || [])
  const [countryOpen,  setCountryOpen]  = useState(false)
  const [tiktokScript,   setTiktokScript]   = useState('')
  const [twitterThread,  setTwitterThread]  = useState<string[]>([])
  const [whatsappMsg,    setWhatsappMsg]    = useState('')
  const [fbPost,         setFbPost]         = useState('')

  // Pre-fill from Quick Publish "Review in Full Editor" flow
  useEffect(() => {
    if (isEdit) return
    const raw = localStorage.getItem('quick_publish_draft')
    if (!raw) return
    try {
      const d = JSON.parse(raw) as {
        title?: string; slug?: string; body?: string; excerpt?: string
        categoryId?: number; featuredImage?: string; metaTitle?: string; metaDesc?: string
      }
      if (d.title)        setTitle(d.title)
      if (d.slug)         setSlug(d.slug)
      if (d.body)         setBody(d.body)
      if (d.excerpt)      setExcerpt(d.excerpt)
      if (d.categoryId)   setCatId(d.categoryId)
      if (d.featuredImage) setImgUrl(d.featuredImage)
      if (d.metaTitle)    setMetaT(d.metaTitle)
      if (d.metaDesc)     setMetaD(d.metaDesc)
      localStorage.removeItem('quick_publish_draft')
    } catch { /* ignore malformed draft */ }
  }, [isEdit])

  useEffect(() => {
    if (!authorId) {
      const random = CC_AUTHORS[Math.floor(Math.random() * CC_AUTHORS.length)]
      setAuthorId(random.id)
      setAuthorName(random.name)
    }
  }, [])

  const handleTitleChange = useCallback((val: string) => {
    setTitle(val)
    if (!isEdit) setSlug(slugify(val))
  }, [isEdit])

  async function handleAiEnhance() {
    if (!title || !body) { setMsg('Add title and body first'); return }
    setAiLoading(true)
    setMsg('')
    try {
      const res  = await fetch('/api/admin/ai/enhance', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title, body, type: 'full' }),
      })
      const data = await res.json() as {
        title?: string; meta_title?: string; meta_desc?: string; excerpt?: string
        enhanced_body?: string; error?: string; author_id?: number; author_name?: string
        author_avatar?: string; tiktok_script?: string; twitter_thread?: string[]
        whatsapp_message?: string; facebook_post?: string
      }
      if (data.title) {
        setTitle(data.title)
        setSlug(slugify(data.title))
      }
      if (data.meta_title)       setMetaT(data.meta_title)
      if (data.meta_desc)        setMetaD(data.meta_desc)
      if (data.excerpt)          setExcerpt(data.excerpt)
      if (data.enhanced_body)    setBody(data.enhanced_body)
      if (data.author_id)        { setAuthorId(data.author_id); setAuthorName(data.author_name ?? '') }
      if (data.tiktok_script)    setTiktokScript(data.tiktok_script)
      if (data.twitter_thread)   setTwitterThread(Array.isArray(data.twitter_thread) ? data.twitter_thread : [])
      if (data.whatsapp_message) setWhatsappMsg(data.whatsapp_message)
      if (data.facebook_post)    setFbPost(data.facebook_post)
      setMsg(data.error ? '✗ AI error' : '✓ AI enhanced')
    } catch {
      setMsg('✗ AI request failed')
    }
    setAiLoading(false)
  }

  async function handleSave(publishStatus: string, exit = false) {
    if (!title.trim()) { setMsg('Title is required'); return }
    if (!slug.trim())  { setMsg('Slug is required'); return }
if (!body.trim())  { setMsg('Body is required'); return }
    setSaving(true)
    setMsg('')
    const payload = {
      title, slug, body, excerpt, categoryId: (catId && catId > 0 && categories.some(c => c.id === catId)) ? catId : (article?.categoryId && categories.some(c => c.id === article.categoryId) ? article.categoryId : (categories[0]?.id || 1)),
      featuredImage: imgUrl || null, status: publishStatus,
      isBreaking: breaking, isFeatured: featured, isLive: isLive ? 1 : 0,
      countryTags: countryTags.length > 0 ? countryTags : null,
      metaTitle: metaT || null, metaDesc: metaD || null,
      authorId: authorId || null,
    }
    try {
      const res  = await fetch(
        isEdit ? `/api/admin/articles/${article!.id}` : '/api/admin/articles',
        { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      )
      const data = await res.json() as { ok?: boolean; id?: number; error?: string }
      if (data.ok) {
        setMsg(`✓ ${publishStatus === 'published' ? 'Published' : 'Saved'}`)
        setStatus(publishStatus as ArticleStatus)
        if (exit) { setSaving(false); router.push('/admin/articles?status=draft'); return }
        if (!isEdit && data.id) router.push(`/admin/articles/${data.id}/edit`)
      } else {
        setMsg(`✗ ${data.error || 'Save failed'}`)
      }
    } catch {
      setMsg('✗ Network error')
    } finally {
      setSaving(false)
    }
  }

  async function handleUnpublish() {
    if (!article?.id) return
    setSaving(true)
    setMsg('')
    try {
      const res  = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft' }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (data.ok) { setStatus('draft'); setMsg('✓ Unpublished') }
      else setMsg(`✗ ${data.error || 'Failed'}`)
    } catch { setMsg('✗ Network error') }
    setSaving(false)
  }

  async function handleDelete() {
    if (!article?.id) return
    if (!window.confirm('Delete this article? This cannot be undone.')) return
    setSaving(true)
    try {
      await fetch(`/api/admin/articles/${article.id}`, { method: 'DELETE' })
      router.push('/admin/articles')
    } catch { setMsg('✗ Delete failed'); setSaving(false) }
  }

  const mainSlugs = [
    'politics', 'society', 'sportsnews', 'southern-cameroons',
    'health', 'business', 'lifestyle', 'editorial',
    'headlines', 'inside-cpdm', 'technology', 'religion', 'poetry'
  ]
  const filteredCats = categories.filter(c => mainSlugs.includes(c.slug))

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#080808', border: '1px solid #2A2A2A',
    borderRadius: '8px', padding: '10px 12px', color: '#EEE',
    fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.62rem', fontWeight: 700,
    color: '#555', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px',
  }

  return (
    <div style={{ maxWidth: '960px' }}>

      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', margin: 0 }}>
            {isEdit ? 'Edit Article' : 'New Article'}
          </h1>
          {isEdit && (
            <div style={{ fontSize: '0.65rem', color: '#333', marginTop: '2px' }}>
              ID #{article!.id} · {status}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {msg && (
            <span style={{ fontSize: '0.75rem', color: msg.startsWith('✓') ? '#007A3D' : '#C8102E' }}>
              {msg}
            </span>
          )}
          <button onClick={handleAiEnhance} disabled={aiLoading} style={{
            background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#F5A623',
            padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem',
            fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer',
          }}>
            {aiLoading ? '⏳ AI...' : '✨ AI Enhance'}
          </button>
          <button onClick={() => handleSave(status || 'draft')} disabled={saving} style={{
            background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#EEE',
            padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem',
            fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            Save
          </button>
          <button onClick={() => handleSave(status || 'draft', true)} disabled={saving} style={{
            background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#EEE',
            padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem',
            fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            Save & Exit
          </button>
          {isEdit && status === 'published' && (
            <button onClick={handleUnpublish} disabled={saving} style={{
              background: 'transparent', border: '1px solid #444', color: '#888',
              padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem',
              fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              Unpublish
            </button>
          )}
          {isEdit && (
            <button onClick={handleDelete} disabled={saving} style={{
              background: 'transparent', border: '1px solid #C8102E', color: '#C8102E',
              padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem',
              fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              Delete
            </button>
          )}
          <button onClick={() => handleSave('published', true)} disabled={saving} style={{
            background: '#C8102E', color: '#fff', border: 'none',
            padding: '8px 20px', borderRadius: '8px', fontSize: '0.75rem',
            fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Saving...' : 'Publish →'}
          </button>
        </div>
      </div>

      {/* Two-column editor layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>

        {/* Left — main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Article headline..."
              style={{ ...inputStyle, fontSize: '1rem', fontWeight: 600 }}
            />
          </div>
          <div>
            <label style={labelStyle}>Slug</label>
            <input
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="article-slug-here"
              style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.82rem', color: '#888' }}
            />
            {authorName && <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '4px' }}>Author: {authorName}</div>}
          </div>
          <div>
            <label style={labelStyle}>Excerpt</label>
            <textarea
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder="Brief summary (2–3 sentences)..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>
          <div>
            <label style={labelStyle}>Body (HTML) *</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="<p>Article content...</p>"
              rows={22}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.7 }}
            />
          </div>
        </div>

        {/* Right — sidebar settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Category */}
          <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '12px', padding: '16px' }}>
            <label style={labelStyle}>Category *</label>
            <select
              value={catId}
              onChange={e => setCatId(parseInt(e.target.value))}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {filteredCats.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Author */}
          <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '12px', padding: '16px' }}>
            <label style={labelStyle}>Author *</label>
            <select
              value={authorId ?? ''}
              onChange={e => {
                const id = Number(e.target.value)
                const found = CC_AUTHORS.find(a => a.id === id)
                setAuthorId(id)
                setAuthorName(found?.name ?? '')
              }}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">— Select author —</option>
              {CC_AUTHORS.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Image */}
          <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '12px', padding: '16px' }}>
            <label style={labelStyle}>Featured Image</label>
            <input
              value={imgUrl}
              onChange={e => setImgUrl(e.target.value)}
              placeholder="https://media.cameroon-concord.com/..."
              style={{ ...inputStyle, fontSize: '0.78rem', marginBottom: '8px' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <label style={{
                background: '#1a1a1a', border: '1px dashed #333', borderRadius: '6px',
                padding: '8px 14px', cursor: 'pointer', fontSize: '0.78rem', color: '#999',
                display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0
              }}>
                📷 Upload from device
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const form = new FormData()
                    form.append('file', file)
                    const res = await fetch('/api/admin/upload', { method: 'POST', body: form, credentials: 'include' })
                    const data = await res.json()
                    if (data.url) setImgUrl(data.url)
                  }}
                />
              </label>
              <span style={{ color: '#444', fontSize: '0.75rem' }}>or paste URL above</span>
            </div>
            {imgUrl && (
              <img
                src={imgUrl}
                alt=""
                style={{ width: '100%', borderRadius: '6px', marginTop: '10px', aspectRatio: '16/9', objectFit: 'cover' }}
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
            )}
          </div>

          {/* Flags */}
          <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '12px', padding: '16px' }}>
            <label style={labelStyle}>Flags</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={breaking} onChange={e => setBreaking(e.target.checked)} />
                <span style={{ fontSize: '0.78rem', color: '#EEE' }}>Breaking News</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
                <span style={{ fontSize: '0.78rem', color: '#EEE' }}>Featured (Hero)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={isLive} onChange={e => setIsLive(e.target.checked)} />
                <span style={{ fontSize: '0.78rem', color: '#C8102E' }}>🔴 Live Blog</span>
              </label>
            </div>
          </div>

          {/* Country / Region Tags */}
          <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '12px', padding: '16px' }}>
            <button
              type="button"
              onClick={() => setCountryOpen(o => !o)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <span style={{ ...labelStyle, margin: 0 }}>Country / Region Tags</span>
              <span style={{ fontSize: '0.7rem', color: '#555' }}>
                {countryTags.length > 0 ? `${countryTags.length} selected` : 'none'} {countryOpen ? '▲' : '▼'}
              </span>
            </button>
            {countryTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                {countryTags.map(t => (
                  <span key={t} style={{ background: '#D4AF3720', border: '1px solid #D4AF3760', color: '#D4AF37', fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t}
                  </span>
                ))}
              </div>
            )}
            {countryOpen && (
              <div style={{ marginTop: '10px', maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {COUNTRY_GROUPS.map(group => (
                  <div key={group.label}>
                    <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#444', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '6px' }}>{group.label}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {group.items.map(item => {
                        const active = countryTags.includes(item)
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setCountryTags(prev => active ? prev.filter(x => x !== item) : [...prev, item])}
                            style={{
                              fontSize: '0.62rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px',
                              textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
                              border: `1px solid ${active ? '#D4AF37' : '#2A2A2A'}`,
                              background: active ? '#D4AF3722' : 'transparent',
                              color: active ? '#D4AF37' : '#555',
                            }}
                          >
                            {item}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEO */}
          <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '12px', padding: '16px' }}>
            <label style={labelStyle}>SEO Meta Title</label>
            <input
              value={metaT}
              onChange={e => setMetaT(e.target.value)}
              placeholder="SEO title (max 60 chars)"
              style={{ ...inputStyle, marginBottom: '12px', fontSize: '0.78rem' }}
            />
            <label style={labelStyle}>SEO Meta Description</label>
            <textarea
              value={metaD}
              onChange={e => setMetaD(e.target.value)}
              placeholder="Meta description (max 155 chars)"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontSize: '0.78rem', lineHeight: 1.5 }}
            />
            <div style={{ fontSize: '0.62rem', color: metaD.length > 155 ? '#C8102E' : '#444', marginTop: '4px' }}>
              {metaD.length}/155
            </div>
          </div>

          {/* Social Assets */}
          {(tiktokScript || whatsappMsg || fbPost || twitterThread.length > 0) && (
            <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#F5A623', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
                📱 Social Assets
              </div>

              {tiktokScript && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.62rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>🎵 TikTok / Reels Script</div>
                  <div style={{ fontSize: '0.78rem', color: '#aaa', background: '#161616', borderRadius: '6px', padding: '8px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{tiktokScript}</div>
                  <button onClick={() => navigator.clipboard.writeText(tiktokScript)} style={{ marginTop: '4px', fontSize: '0.65rem', color: '#F5A623', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Copy</button>
                </div>
              )}

              {twitterThread.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.62rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>🐦 Twitter/X Thread ({twitterThread.length} tweets)</div>
                  {twitterThread.map((tweet, i) => (
                    <div key={i} style={{ fontSize: '0.78rem', color: '#aaa', background: '#161616', borderRadius: '6px', padding: '6px 8px', marginBottom: '4px', lineHeight: 1.5 }}>
                      <span style={{ color: '#555', fontSize: '0.65rem' }}>{i + 1}.</span> {tweet}
                    </div>
                  ))}
                  <button onClick={() => navigator.clipboard.writeText(twitterThread.join('\n\n'))} style={{ marginTop: '4px', fontSize: '0.65rem', color: '#F5A623', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Copy All</button>
                </div>
              )}

              {whatsappMsg && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.62rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>💬 WhatsApp Broadcast</div>
                  <div style={{ fontSize: '0.78rem', color: '#aaa', background: '#161616', borderRadius: '6px', padding: '8px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{whatsappMsg}</div>
                  <button onClick={() => navigator.clipboard.writeText(whatsappMsg)} style={{ marginTop: '4px', fontSize: '0.65rem', color: '#F5A623', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Copy</button>
                </div>
              )}

              {fbPost && (
                <div>
                  <div style={{ fontSize: '0.62rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>📘 Facebook Post</div>
                  <div style={{ fontSize: '0.78rem', color: '#aaa', background: '#161616', borderRadius: '6px', padding: '8px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{fbPost}</div>
                  <button onClick={() => navigator.clipboard.writeText(fbPost)} style={{ marginTop: '4px', fontSize: '0.65rem', color: '#F5A623', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Copy</button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
