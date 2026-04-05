'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Category } from '@/lib/types'

interface QuickResult {
  title:         string
  slug:          string
  excerpt:       string
  enhanced_body: string
  category_slug: string
  meta_title:    string
  meta_desc:     string
  keywords:      string[]
  error?:        string
}

interface Props {
  categories: Category[]
}

const MAIN_SLUGS = [
  'politics', 'society', 'sportsnews', 'southern-cameroons',
  'health', 'business', 'lifestyle', 'editorial',
  'headlines', 'inside-cpdm',
]

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#080808', border: '1px solid #2A2A2A',
  borderRadius: '8px', padding: '10px 12px', color: '#EEE',
  fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.62rem', fontWeight: 700,
  color: '#555', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px',
}

export function QuickPublish({ categories }: Props) {
  const router = useRouter()
  const filteredCats = categories.filter(c => MAIN_SLUGS.includes(c.slug))

  const [rawText,    setRawText]    = useState('')
  const [imageUrl,   setImageUrl]   = useState('')
  const [processing, setProcessing] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [msg,        setMsg]        = useState('')
  const [result,     setResult]     = useState<QuickResult | null>(null)

  // Editable result fields
  const [title,     setTitle]     = useState('')
  const [slug,      setSlug]      = useState('')
  const [catId,     setCatId]     = useState<number>(0)
  const [excerpt,   setExcerpt]   = useState('')
  const [body,      setBody]      = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDesc,  setMetaDesc]  = useState('')

  async function handleProcess() {
    if (!rawText.trim()) return
    setProcessing(true)
    setMsg('')
    setResult(null)
    try {
      const res  = await fetch('/api/admin/ai/enhance', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title: rawText.substring(0, 100), body: rawText, type: 'quick' }),
      })
      const data = await res.json() as QuickResult
      if (data.error) { setMsg('✗ AI error: ' + data.error); setProcessing(false); return }

      setResult(data)
      setTitle(data.title || '')
      setSlug(data.slug || '')
      setExcerpt(data.excerpt || '')
      setBody(data.enhanced_body || '')
      setMetaTitle(data.meta_title || '')
      setMetaDesc(data.meta_desc || '')

      const match = filteredCats.find(c => c.slug === data.category_slug)
      setCatId(match?.id ?? filteredCats[0]?.id ?? 0)
      setMsg('✓ AI processed')
    } catch {
      setMsg('✗ Processing failed')
    }
    setProcessing(false)
  }

  function handleReview() {
    if (!result) return
    localStorage.setItem('quick_publish_draft', JSON.stringify({
      title, slug, body,
      excerpt, categoryId: catId,
      featuredImage: imageUrl || '',
      metaTitle, metaDesc,
    }))
    router.push('/admin/articles/new?from=quick')
  }

  async function handlePublish() {
    if (!result || !title.trim() || !slug.trim()) return
    setSaving(true)
    setMsg('')
    try {
      const res  = await fetch('/api/admin/articles', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json', 'x-api-key': 'AUTOMATION_KEY_REMOVED' },
        body:        JSON.stringify({
          title, slug, body: body || result.enhanced_body, excerpt,
          categoryId: catId, featuredImage: imageUrl || null,
          status: 'published', metaTitle: metaTitle || null, metaDesc: metaDesc || null,
        }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (data.ok) {
        router.push('/admin/articles')
      } else {
        setMsg('✗ ' + (data.error || 'Publish failed'))
        setSaving(false)
      }
    } catch {
      setMsg('✗ Network error')
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: '960px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', margin: 0 }}>⚡ Quick Publish</h1>
          <p style={{ fontSize: '0.65rem', color: '#555', marginTop: '4px' }}>
            Paste raw text → AI processes → review → publish
          </p>
        </div>
        {msg && (
          <span style={{ fontSize: '0.75rem', color: msg.startsWith('✓') ? '#007A3D' : '#C8102E' }}>
            {msg}
          </span>
        )}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '60% 1fr', gap: '24px', alignItems: 'start' }}>

        {/* LEFT — Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Raw Content *</label>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Paste raw news text here. Claude will translate, rewrite in Cameroon Concord style, assign category, generate title, excerpt, body and SEO fields."
              rows={14}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7, minHeight: '300px' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Featured Image URL (optional)</label>
            <input
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://..."
              style={{ ...inputStyle, fontSize: '0.82rem' }}
            />
          </div>
          <button
            onClick={handleProcess}
            disabled={processing || !rawText.trim()}
            style={{
              background: '#C8102E', color: '#fff', border: 'none',
              padding: '12px 24px', borderRadius: '8px', fontSize: '0.82rem',
              fontWeight: 700, alignSelf: 'flex-start',
              cursor: processing || !rawText.trim() ? 'not-allowed' : 'pointer',
              opacity: !rawText.trim() ? 0.5 : 1,
            }}
          >
            {processing ? '⏳ Processing...' : '⚡ AI Process'}
          </button>
        </div>

        {/* RIGHT — Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!result ? (
            <div style={{
              background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '12px',
              padding: '48px 24px', textAlign: 'center', color: '#2A2A2A', fontSize: '0.8rem',
            }}>
              Results appear here after AI processing
            </div>
          ) : (
            <>
              <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Title</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Slug</label>
                  <input
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.78rem', color: '#888' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
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
                <div>
                  <label style={labelStyle}>Excerpt</label>
                  <textarea
                    value={excerpt}
                    onChange={e => setExcerpt(e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Body Preview</label>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={10}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7, minHeight: '200px', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>SEO Meta Title</label>
                  <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} style={{ ...inputStyle, fontSize: '0.78rem' }} />
                </div>
                <div>
                  <label style={labelStyle}>SEO Meta Description</label>
                  <textarea
                    value={metaDesc}
                    onChange={e => setMetaDesc(e.target.value)}
                    rows={2}
                    style={{ ...inputStyle, resize: 'vertical', fontSize: '0.78rem', lineHeight: 1.5 }}
                  />
                  <div style={{ fontSize: '0.62rem', color: metaDesc.length > 155 ? '#C8102E' : '#444', marginTop: '4px' }}>
                    {metaDesc.length}/155
                  </div>
                </div>
                {result.keywords?.length > 0 && (
                  <div>
                    <label style={labelStyle}>Keywords</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {result.keywords.map(k => (
                        <span key={k} style={{ background: '#1A1A1A', color: '#555', padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem' }}>
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={handleReview}
                  style={{
                    background: 'transparent', border: '1px solid #2A2A2A', color: '#888',
                    padding: '10px 16px', borderRadius: '8px', fontSize: '0.78rem',
                    fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Review in Full Editor →
                </button>
                <button
                  onClick={handlePublish}
                  disabled={saving || !title.trim() || !slug.trim()}
                  style={{
                    background: '#007A3D', color: '#fff', border: 'none',
                    padding: '10px 16px', borderRadius: '8px', fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: saving || !title.trim() || !slug.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Publishing...' : 'Publish Now →'}
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
