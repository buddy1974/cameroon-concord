export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleCard }   from '@/components/article/ArticleCard'
import { JsonLd }        from '@/components/seo/JsonLd'
import {
  getFeaturedArticles,
  getLatestArticles,
  getMostRead,
  getArticlesByCategory,
  getAllCategories,
} from '@/lib/db/queries'
import { buildSiteMetadata }       from '@/lib/seo/metadata'
import { buildOrganizationSchema } from '@/lib/seo/schema'

export const metadata: Metadata = buildSiteMetadata()

export default async function HomePage() {
  const [featured, latest, mostRead] = await Promise.all([
    getFeaturedArticles(5),
    getLatestArticles(12),
    getMostRead(5),
  ])

  const allCats = await getAllCategories()
  const targetSlugs = ['politics', 'society', 'sports', 'southern-cameroons', 'health', 'business']
  const availableSlugs = targetSlugs.filter(s =>
    allCats.some(c => c.slug.toLowerCase() === s.toLowerCase())
  )

  const categoryRows = await Promise.all(
    availableSlugs.map(async slug => {
      const cat = allCats.find(c => c.slug.toLowerCase() === slug.toLowerCase())
      const { articles: catArticles } = await getArticlesByCategory(cat!.slug, 1, 4)
      return { slug: cat!.slug, name: cat!.name, articles: catArticles }
    })
  )

  const hero      = featured[0]
  const secondary = featured.slice(1, 3)
  const tertiary  = featured.slice(3, 5)

  return (
    <>
      <JsonLd data={buildOrganizationSchema()} />

      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">

        {/* HERO — full-width overlay card */}
        {hero && (
          <section className="mb-8">
            <ArticleCard article={hero} variant="hero" priority />
          </section>
        )}

        {/* SECONDARY GRID */}
        {secondary.length > 0 && (
          <section className="mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {secondary.map(a => (
                <ArticleCard key={a.id} article={a} variant="featured" />
              ))}
              {tertiary.map(a => (
                <ArticleCard key={a.id} article={a} variant="featured" />
              ))}
            </div>
          </section>
        )}

        {/* DIVIDER */}
        <div className="border-t border-[#1E1E1E] mb-10" />

        {/* MAIN CONTENT + SIDEBAR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Latest articles */}
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white border-l-2 border-[#C8102E] pl-3">
                Latest News
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {latest.map(a => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </section>

          {/* SIDEBAR */}
          <aside className="space-y-8">

            {/* Most Read */}
            <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-4">
              <h3 className="text-[0.6rem] font-black uppercase tracking-[0.18em] text-white border-l-2 border-[#F5A623] pl-3 mb-4">
                Most Read
              </h3>
              <div className="divide-y divide-[#1E1E1E]">
                {mostRead.map((a, i) => (
                  <div key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="text-3xl font-black text-[#1E1E1E] leading-none w-7 flex-shrink-0 select-none">
                      {i + 1}
                    </span>
                    <ArticleCard article={a} variant="compact" />
                  </div>
                ))}
              </div>
            </div>

            {/* Ad unit */}
            <div className="ad-wrap">
              <p className="ad-label">Advertisement</p>
              <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-0554291063972402"
                data-ad-slot="auto"
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
            </div>

          </aside>
        </div>

        {/* CATEGORY ROWS */}
        {categoryRows.map(row => (
          row.articles.length > 0 && (
            <section key={row.slug} className="mt-14">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white border-l-2 border-[#C8102E] pl-3">
                  {row.name}
                </h2>
                <Link
                  href={`/${row.slug}`}
                  className="text-[0.65rem] font-bold text-[#C8102E] hover:text-[#F5A623] transition-colors uppercase tracking-wider">
                  See all →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {row.articles.map(a => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )
        ))}

        {/* Bottom ad */}
        <div className="ad-wrap mt-14">
          <p className="ad-label">Advertisement</p>
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-0554291063972402"
            data-ad-slot="auto"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>

      </div>
    </>
  )
}
