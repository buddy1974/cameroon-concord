export const revalidate = 60

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleCard } from '@/components/article/ArticleCard'
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
  let featured: ArticleWithRelations[] = []
  let latest:   ArticleWithRelations[] = []
  let mostRead: ArticleWithRelations[] = []
  let allCats:  Category[]             = []

  try {
    ;[featured, latest, mostRead, allCats] = await Promise.all([
      getFeaturedArticles(7),
      getLatestArticles(18),
      getMostRead(6),
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

  const hero = featured[0]
  const sub  = featured.slice(1, 4)
  const rest = featured.slice(4, 7)

  return (
    <>
      <JsonLd data={buildOrganizationSchema()} />

      <div className="max-w-[1380px] mx-auto px-4 sm:px-6">

        {/* ── HERO + SUB GRID ── */}
        {hero && (
          <section className="pt-6 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
              {/* Big hero */}
              <div className="lg:col-span-3">
                <ArticleCard article={hero} variant="hero" priority />
              </div>
              {/* Sub stack */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                {sub.map(a => <ArticleCard key={a.id} article={a} variant="featured" />)}
              </div>
            </div>
            {/* Tertiary row */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                {rest.map(a => <ArticleCard key={a.id} article={a} variant="featured" />)}
              </div>
            )}
          </section>
        )}

        {/* ── LATEST + SIDEBAR ── */}
        <section className="pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Latest articles */}
            <div className="lg:col-span-2">
              <div className="section-head">
                <span className="section-head-title">Latest News</span>
                <span className="section-head-line" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {latest.map(a => <ArticleCard key={a.id} article={a} />)}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Most Read */}
              <div className="bg-[#101010] border border-[#1E1E1E] rounded-xl p-5">
                <div className="section-head">
                  <span className="section-head-title" style={{ color: '#F5A623' }}>Most Read</span>
                  <span className="section-head-line" />
                </div>
                {mostRead.map((a, i) => (
                  <ArticleCard key={a.id} article={a} variant="list" index={i} />
                ))}
              </div>

            </aside>
          </div>
        </section>

        {/* ── CATEGORY SECTIONS ── */}
        {categoryRows.map(row => row.articles.length > 0 && (
          <section key={row.slug} className="pb-12">
            <div className="section-head">
              <span className="section-head-title">{row.name}</span>
              <span className="section-head-line" />
              <Link href={`/${row.slug}`}
                className="text-[0.62rem] font-bold uppercase tracking-wider text-[#C8102E] hover:text-[#F5A623] transition-colors whitespace-nowrap">
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {row.articles.map(a => <ArticleCard key={a.id} article={a} />)}
            </div>
          </section>
        ))}

      </div>
    </>
  )
}
