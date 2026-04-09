export const dynamic  = 'force-dynamic'
export const revalidate = 0

import type { Metadata } from 'next'
import Link from 'next/link'
import AdUnit from '@/components/ads/AdUnit'
import { ArticleCard } from '@/components/article/ArticleCard'
import InstallBanner from '@/components/pwa/InstallBanner'
import SubscribeForm from '@/components/newsletter/SubscribeForm'
import { JsonLd } from '@/components/seo/JsonLd'
import {
  getFeaturedArticles, getLatestArticles,
  getMostRead, getArticlesByCategory, getAllCategories,
} from '@/lib/db/queries'
import { buildSiteMetadata } from '@/lib/seo/metadata'
import { buildOrganizationSchema } from '@/lib/seo/schema'
import type { ArticleWithRelations, Category } from '@/lib/types'

export const metadata: Metadata = buildSiteMetadata()

export default async function HomePage() {
  let featured:       ArticleWithRelations[] = []
  let latest:         ArticleWithRelations[] = []
  let mostRead:       ArticleWithRelations[] = []
  let allCats:        Category[]             = []

  try {
    ;[featured, latest, mostRead, allCats] = await Promise.all([
      getFeaturedArticles(7),
      getLatestArticles(18),
      getMostRead(5),
      getAllCategories(),
    ])
  } catch (err) {
    console.error('Homepage DB error:', err)
  }

  const targetSlugs = ['politics', 'society', 'sportsnews', 'southern-cameroons', 'health', 'business']
  const availableSlugs = targetSlugs.filter(s => allCats.some(c => c.slug === s))

  let categoryRows: { slug: string; name: string; articles: ArticleWithRelations[] }[] = []
  try {
    categoryRows = await Promise.all(
      availableSlugs.slice(0, 4).map(async slug => {
        const cat = allCats.find(c => c.slug === slug)!
        const { articles: arts } = await getArticlesByCategory(cat.slug, 1, 4)
        return { slug: cat.slug, name: cat.name, articles: arts }
      })
    )
  } catch (err) {
    console.error('Category rows DB error:', err)
  }

  return (
    <>
      <JsonLd data={buildOrganizationSchema()} />

      <div style={{
        paddingTop: '24px',
        paddingBottom: '48px',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px'
      }}>

        {/* ── HERO SECTION ── */}
        {featured[0] && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '24px',
            alignItems: 'stretch'
          }}>

            {/* LEFT — DOMINANT STORY */}
            <ArticleCard article={featured[0]} variant="hero" priority />

            {/* RIGHT — 2 STACKED STORIES, equal height */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              height: '100%'
            }}>
              {featured.slice(1, 3).map(a => (
                <div key={a.id} style={{ flex: 1, minHeight: 0 }}>
                  <ArticleCard article={a} variant="featured" />
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ── APP INSTALL BANNER ── */}
        <InstallBanner />

        {/* ── TOP BANNER AD ── */}
        <div className="w-full max-w-[728px] mx-auto my-4">
          <AdUnit slot="9844142257" format="horizontal" />
        </div>

        {/* ── LATEST NEWS + SIDEBAR ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '32px',
          alignItems: 'start'
        }}>

          {/* MAIN — 3-column article grid */}
          <div>
            <div className="section-head">
              <span className="section-head-title">Latest News</span>
              <span className="section-head-line" />
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px'
            }}>
              {latest.slice(0, 9).map(a => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </div>

          {/* SIDEBAR — Most Read */}
          <aside>
            <div style={{ marginBottom: '16px' }}>
              <SubscribeForm source="homepage" />
            </div>
            <div className="bg-[#101010] border border-[#1E1E1E] rounded-xl p-5">
              <div className="section-head">
                <span className="section-head-title" style={{ color: '#F5A623' }}>Most Read</span>
                <span className="section-head-line" />
              </div>
              {mostRead.map((a, i) => (
                <ArticleCard key={a.id} article={a} variant="list" index={i} />
              ))}
            </div>
            {latest.slice(0, 10).length > 0 && (
              <div className="bg-[#101010] border border-[#1E1E1E] rounded-xl p-5" style={{ marginTop: '16px' }}>
                <div className="section-head">
                  <span className="section-head-title" style={{ color: '#F5A623' }}>Latest Articles</span>
                  <span className="section-head-line" />
                </div>
                {latest.slice(0, 10).map((a, i) => (
                  <ArticleCard key={a.id} article={a} variant="list" index={i} />
                ))}
              </div>
            )}
          </aside>

        </div>

        {/* ── CATEGORY SECTIONS ── */}
        {categoryRows.map(row => row.articles.length > 0 && (
          <section key={row.slug}>
            <div className="section-head">
              <span className="section-head-title">{row.name}</span>
              <span className="section-head-line" />
              <Link
                href={`/${row.slug}`}
                className="text-[0.62rem] font-bold uppercase tracking-wider text-[#C8102E] hover:text-[#F5A623] transition-colors whitespace-nowrap"
              >
                See all →
              </Link>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px'
            }}>
              {row.articles.map(a => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </section>
        ))}

      </div>
    </>
  )
}
