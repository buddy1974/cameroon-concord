import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Search Articles | Cameroon Concord',
  description: 'Search Cameroon Concord articles and coverage.',
  alternates: { canonical: `${SITE_URL}/search` },
  robots: { index: false, follow: true },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
