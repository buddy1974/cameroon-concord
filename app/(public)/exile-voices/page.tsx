'use client'
import { useState } from 'react'

const REGIONS = [
  'Northwest Region', 'Southwest Region', 'Littoral Region',
  'Centre Region', 'West Region', 'South Region',
  'East Region', 'North Region', 'Far North Region',
  'Adamawa Region', 'Diaspora — Europe', 'Diaspora — Americas',
  'Diaspora — Africa', 'Prefer not to say',
]

const CATEGORIES = [
  { value: 'military',     label: 'Military / Security' },
  { value: 'corruption',   label: 'Corruption' },
  { value: 'anglophone',   label: 'Anglophone Crisis' },
  { value: 'politics',     label: 'Politics' },
  { value: 'human-rights', label: 'Human Rights' },
  { value: 'general',      label: 'General' },
]

export default function ExileVoicesPage() {
  const [content, setContent]   = useState('')
  const [region, setRegion]     = useState('')
  const [category, setCategory] = useState('general')
  const [status, setStatus]     = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  async function submit() {
    if (content.trim().length < 50) return
    setStatus('sending')
    try {
      const res = await fetch('/api/exile/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content, region, category }),
      })
      if (res.ok) { setStatus('done'); setContent(''); setRegion('') }
      else setStatus('error')
    } catch { setStatus('error') }
  }

  const ready = content.trim().length >= 50

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#C8102E', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
        Exile Voices
      </div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F0F0F0', marginBottom: '12px', lineHeight: 1.2 }}>
        Your Voice. Anonymous. Protected.
      </h1>
      <p style={{ fontSize: '0.9rem', color: '#888', lineHeight: 1.7, marginBottom: '12px' }}>
        Are you inside Cameroon — or in the diaspora — with information the public needs to know? Submit here. No name. No email. No account. Your IP address is never stored.
      </p>
      <div style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: '10px', padding: '16px', marginBottom: '24px', fontSize: '0.78rem', color: '#555', lineHeight: 1.6 }}>
        🔒 <strong style={{ color: '#F5A623' }}>How we protect you:</strong> We do not store your IP address, name, or any identifying information. Submissions are reviewed by our editorial team before publication. We will never reveal sources.
      </div>

      {status === 'done' ? (
        <div style={{ background: '#0F1A0F', border: '1px solid #22C55E', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✓</div>
          <div style={{ fontSize: '0.9rem', color: '#22C55E', fontWeight: 700, marginBottom: '4px' }}>Submission received</div>
          <div style={{ fontSize: '0.78rem', color: '#555' }}>Our editorial team will review it. Thank you for your courage.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
              Your submission *
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What do you know? What have you witnessed? What does Cameroon need to hear?"
              rows={8}
              style={{ width: '100%', background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '8px', padding: '12px', color: '#E0E0E0', fontSize: '0.9rem', lineHeight: 1.6, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
            />
            <div style={{ fontSize: '0.65rem', color: '#444', marginTop: '4px' }}>
              {content.length} characters {content.length > 0 && content.length < 50 ? '— minimum 50' : ''}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                Region (optional)
              </label>
              <select value={region} onChange={e => setRegion(e.target.value)}
                style={{ width: '100%', background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '8px', padding: '10px', color: '#888', fontSize: '0.82rem' }}>
                <option value="">— Select —</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                Topic
              </label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                style={{ width: '100%', background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '8px', padding: '10px', color: '#888', fontSize: '0.82rem' }}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={submit}
            disabled={!ready || status === 'sending'}
            style={{ padding: '14px', background: ready ? '#C8102E' : '#1A1A1A', color: ready ? '#fff' : '#444', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: ready ? 'pointer' : 'not-allowed' }}
          >
            {status === 'sending' ? 'Submitting...' : 'Submit Anonymously'}
          </button>

          {status === 'error' && (
            <div style={{ fontSize: '0.78rem', color: '#C8102E', textAlign: 'center' }}>
              Submission failed. Please try again.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
