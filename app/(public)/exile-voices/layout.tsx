import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Exile Voices | Cameroon Concord',
  description: 'Anonymous, protected submissions for Cameroon Concord editorial review.',
  alternates: { canonical: `${SITE_URL}/exile-voices` },
}

export default function ExileVoicesLayout({ children }: { children: React.ReactNode }) {
  return children
}
