import { Header }         from '@/components/layout/Header'
import { Footer }         from '@/components/layout/Footer'
import { BreakingBanner } from '@/components/article/BreakingBanner'
import { getBreakingNews } from '@/lib/db/queries'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let breaking: Awaited<ReturnType<typeof getBreakingNews>> = []
  try { breaking = await getBreakingNews(5) } catch { /* DB unavailable at build time */ }
  return (
    <>
      <BreakingBanner articles={breaking} />
      <Header />
      <main className="min-h-screen w-full">
        <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '0 24px' }}>
          {children}
        </div>
      </main>
      <Footer />
    </>
  )
}
