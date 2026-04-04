import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'RSS Feed',
  description: `Subscribe to ${SITE_NAME}'s RSS feed to get the latest Cameroon news delivered to your RSS reader.`,
}

const FEED_URL = `${SITE_URL}/api/rss`

export default function RssPage() {
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px' }}>

      <nav className="text-[0.65rem] text-[#444] mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <span>›</span>
        <span className="text-[#C8102E] font-semibold">RSS Feed</span>
      </nav>

      <h1 className="text-3xl font-black text-white mb-4">RSS Feed</h1>

      <p className="text-sm text-[#9CA3AF] leading-relaxed mb-8">
        Subscribe to {SITE_NAME}&apos;s RSS feed to get the latest news delivered directly
        to your RSS reader. Paste the feed URL into any RSS reader app such as
        Feedly, Inoreader, or NetNewsWire.
      </p>

      <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <p className="text-[0.6rem] font-black uppercase tracking-widest text-[#444] mb-3">Feed URL</p>
        <code className="block text-sm text-[#F5A623] break-all leading-relaxed">{FEED_URL}</code>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href="/api/rss"
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: '#C8102E', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}
        >
          Open RSS Feed →
        </a>
        <Link
          href="/"
          style={{ background: '#111', border: '1px solid #1E1E1E', color: '#888', padding: '10px 20px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}
        >
          ← Back to Home
        </Link>
      </div>

    </div>
  )
}
