export const dynamic = 'force-dynamic'

import { Header }         from '@/components/layout/Header'
import { Footer }         from '@/components/layout/Footer'
import { BreakingBanner } from '@/components/article/BreakingBanner'
import { getBreakingNews } from '@/lib/db/queries'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const breaking = await getBreakingNews(5)
  return (
    <>
      <BreakingBanner articles={breaking} />
      <Header />
      <main className="min-h-screen w-full">
        {children}
      </main>
      <Footer />
    </>
  )
}
