import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleCard }   from '@/components/article/ArticleCard'
import { JsonLd }        from '@/components/seo/JsonLd'
import {
  getFeaturedArticles,
  getLatestArticles,
  getMostRead,
  getArticlesByCategory,
} from '@/lib/db/queries'
import { buildSiteMetadata }       from '@/lib/seo/metadata'
import { buildOrganizationSchema } from '@/lib/seo/schema'
import { CATEGORIES }              from '@/lib/constants'

export const revalidate = 60

export const metadata: Metadata = buildSiteMetadata()

export default async function HomePage() {
  const [featured, latest, mostRead] = await Promise.all([
    getFeaturedArticles(5),
    getLatestArticles(12),
    getMostRead(5),
  ])

  const categoryRows = await Promise.all(
    ['politics', 'society', 'sports', 'southern-cameroons'].map(async slug => {
      const { articles } = await getArticlesByCategory(slug, 1, 4)
      const cat = CATEGORIES.find(c => c.slug === slug)
      return { slug, name: cat?.name || slug, articles }
    })
  )

  const hero      = featured[0]
  const secondary = featured.slice(1, 3)
  const tertiary  = featured.slice(3, 5)

  return (
    <>
      <JsonLd data={buildOrganizationSchema()} />

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* HERO */}
        {hero && (
          <section className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <ArticleCard article={hero} variant="featured" priority />
              </div>
              <div className="flex flex-col gap-4">
                {secondary.map(a => (
                  <ArticleCard key={a.id} article={a} variant="featured" />
                ))}
              </div>
            </div>
            {tertiary.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {tertiary.map(a => (
                  <ArticleCard key={a.id} article={a} variant="featured" />
                ))}
              </div>
            )}
          </section>
        )}

        {/* MAIN CONTENT + SIDEBAR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Latest articles */}
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-white border-l-2 border-[#C8102E] pl-3">
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
            <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-white border-l-2 border-[#F5A623] pl-3 mb-4">
                Most Read
              </h3>
              <div className="space-y-1">
                {mostRead.map((a, i) => (
                  <div key={a.id} className="flex items-start gap-3 py-2 border-b border-[#2A2A2A] last:border-0">
                    <span className="text-2xl font-black text-[#2A2A2A] leading-none w-6 flex-shrink-0">
                      {i + 1}
                    </span>
                    <ArticleCard article={a} variant="compact" />
                  </div>
                ))}
              </div>
            </div>

            {/* Ad unit */}
            <div className="ad-container">
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
            <section key={row.slug} className="mt-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-white border-l-2 border-[#C8102E] pl-3">
                  {row.name}
                </h2>
                <Link
                  href={`/${row.slug}`}
                  className="text-xs font-semibold text-[#C8102E] hover:text-[#F5A623] transition-colors uppercase tracking-wider"
                >
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
        <div className="ad-container mt-12">
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
