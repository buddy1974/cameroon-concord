'use client'
import { Fragment } from 'react'

interface Props {
  html: string
}

export function ProgressiveBody({ html }: Props) {
  const parts = splitParagraphs(html)

  if (parts.length <= 1) {
    return (
      <div className="article-body">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    )
  }

  return (
    <div className="article-body">
      {parts.map((part, index) => (
        <Fragment key={`${index}-${part.length}`}>
          <div dangerouslySetInnerHTML={{ __html: part }} />
          {index === 2 && <InlineAd slot="5471720771" />}
          {index === 7 && <InlineAd slot="6360192811" />}
        </Fragment>
      ))}
    </div>
  )
}

function splitParagraphs(html: string): string[] {
  if (!html.includes('</p>')) return [html]
  return html
    .split(/<\/p>/i)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => `${part}</p>`)
}

function InlineAd({ slot }: { slot: string }) {
  return (
    <div style={{ margin: '24px 0' }}>
      <ins className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-client="ca-pub-0554291063972402"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <script dangerouslySetInnerHTML={{ __html: '(adsbygoogle = window.adsbygoogle || []).push({})' }} />
    </div>
  )
}
