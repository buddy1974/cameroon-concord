'use client'
import { useState } from 'react'

interface Props {
  html: string
}

export function ProgressiveBody({ html }: Props) {
  const [expanded, setExpanded] = useState(false)

  const parts   = html.split('</p>').filter(s => s.trim().length > 0)
  const preview = parts.slice(0, 3).map(p => p + '</p>').join('\n')
  const rest    = parts.slice(3).map(p => p + '</p>').join('\n')
  const hasMore = rest.trim().length > 0

  return (
    <div className="article-body">
      <div dangerouslySetInnerHTML={{ __html: preview }} />

      {/* Mid-article ad — always visible after para 3 */}
      <div style={{ margin: '24px 0' }}>
        <ins className="adsbygoogle"
          style={{ display: 'block', textAlign: 'center' }}
          data-ad-client="ca-pub-0554291063972402"
          data-ad-slot="5471720771"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <script dangerouslySetInnerHTML={{ __html: '(adsbygoogle = window.adsbygoogle || []).push({})' }} />
      </div>

      {hasMore && !expanded && (
        <div style={{ position: 'relative', marginTop: '-60px' }}>
          <div style={{ height: '80px', background: 'linear-gradient(to bottom, transparent, #0A0A0A)', pointerEvents: 'none' }} />
          <div style={{ textAlign: 'center', paddingTop: '8px', paddingBottom: '16px', background: '#0A0A0A' }}>
            <button
              onClick={() => setExpanded(true)}
              style={{ padding: '10px 28px', background: '#C8102E', color: '#fff', border: 'none', borderRadius: '24px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.03em' }}
            >
              Continue Reading ↓
            </button>
          </div>
        </div>
      )}

      {hasMore && expanded && (
        <>
          <div dangerouslySetInnerHTML={{ __html: rest }} />
          {/* Mid-article ad — after rest content */}
          <div style={{ margin: '24px 0' }}>
            <ins className="adsbygoogle"
              style={{ display: 'block', textAlign: 'center' }}
              data-ad-client="ca-pub-0554291063972402"
              data-ad-slot="6360192811"
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
            <script dangerouslySetInnerHTML={{ __html: '(adsbygoogle = window.adsbygoogle || []).push({})' }} />
          </div>
        </>
      )}
    </div>
  )
}
