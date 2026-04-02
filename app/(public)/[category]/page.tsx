import type { Metadata } from 'next'
import { notFound }      from 'next/navigation'
import Link              from 'next/link'
import { ArticleCard }   from '@/components/article/ArticleCard'
import { JsonLd }        from '@/components/seo/JsonLd'
import { getCategoryBySlug, getArticlesByCategory } from '@/lib/db/queries'
import { buildCategoryMetadata }  from '@/lib/seo/metadata'
import { buildBreadcrumbSchema }  from '@/lib/seo/schema'
import { SITE_URL }               from '@/lib/constants'

export const revalidate = 120

interface Props { params: Promise<{ category: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return {}
  return buildCategoryMetadata(category)
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const { articles, total } = await getArticlesByCategory(slug, 1, 20)

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home',        url: SITE_URL },
    { name: category.name, url: `${SITE_URL}/${slug}` },
  ])

  return (
    <>
      <JsonLd data={breadcrumb} />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-8">

        {/* Category header */}
        <div className="border-b border-[#1E1E1E] pb-8 mb-8">
          <nav className="text-[0.65rem] text-[#444] mb-4 flex items-center gap-1.5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="text-[#2A2A2A]">›</span>
            <span className="text-[#C8102E] font-semibold">{category.name}</span>
          </nav>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-white tracking-[-0.03em]">{category.name}</h1>
              {category.description && (
                <p
                  className="text-[0.8rem] text-[#555] mt-2 max-w-2xl leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: category.description || '' }}
                />
              )}
            </div>
            <span className="text-[0.65rem] text-[#333] font-semibold whitespace-nowrap">
              {total.toLocaleString()} articles
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Article grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {articles.map(a => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </div>

          <aside>
            <div className="ad-wrap sticky top-24">
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
      </div>
    </>
  )
}
