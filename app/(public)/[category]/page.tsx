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
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Category header */}
        <div className="border-b border-[#2A2A2A] pb-6 mb-8">
          <nav className="text-xs text-[#6B7280] mb-3">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <span className="text-white">{category.name}</span>
          </nav>
          <h1 className="text-3xl font-black text-white">{category.name}</h1>
          {category.description && (
            <p
              className="text-[#6B7280] mt-2 max-w-2xl text-sm"
              dangerouslySetInnerHTML={{ __html: category.description || '' }}
            />
          )}
          <p className="text-xs text-[#4B5563] mt-2">{total.toLocaleString()} articles</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {articles.map(a => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </div>

          <aside>
            <div className="ad-container sticky top-24">
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
