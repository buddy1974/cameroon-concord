import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'My Feed | Cameroon Concord',
  description: 'Personalized Cameroon Concord topic feed.',
  alternates: { canonical: `${SITE_URL}/my-feed` },
  robots: { index: false, follow: true },
}

export default function MyFeedLayout({ children }: { children: React.ReactNode }) {
  return children
}
