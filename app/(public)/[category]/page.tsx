export const revalidate = 120

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArticleCard } from '@/components/article/ArticleCard'
import AdUnit from '@/components/ads/AdUnit'
import { JsonLd } from '@/components/seo/JsonLd'
import { getCategoryBySlug, getArticlesByCategory } from '@/lib/db/queries'
import { buildCategoryMetadata } from '@/lib/seo/metadata'
import { buildBreadcrumbSchema } from '@/lib/seo/schema'
import { SITE_URL } from '@/lib/constants'

interface Props {
  params: Promise<{ category: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return {}
  return buildCategoryMetadata(category)
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category: slug } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1'))
  const PER_PAGE = 24

  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const { articles, total } = await getArticlesByCategory(slug, page, PER_PAGE)
  const totalPages = Math.ceil(total / PER_PAGE)

  // Diagnostic — visible in Vercel function logs
  console.log('[CategoryPage]', { slug, page, returned: articles.length, total, ids: articles.map(a => a.id) })

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home',        url: SITE_URL },
    { name: category.name, url: `${SITE_URL}/${slug}` },
  ])

  return (
    <>
      <JsonLd data={breadcrumb} />

      {/* Global container provides max-width — just add vertical padding */}
      <div style={{ paddingTop: '32px', paddingBottom: '48px' }}>

        {/* Category header */}
        <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #1E1E1E' }}>
          <nav className="text-[0.65rem] text-[#444] mb-3 flex items-center gap-1.5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>›</span>
            <span className="text-[#C8102E] font-semibold">{category.name}</span>
          </nav>
          <div className="flex items-baseline gap-4">
            <h1 className="text-[2.5rem] md:text-[3.5rem] font-black uppercase tracking-[-0.03em] text-white leading-none">
              {category.name}
            </h1>
            <span className="text-[#333] text-sm">{total.toLocaleString()} articles</span>
          </div>
        </div>

        {/* Uniform 3-column article grid */}
        {articles.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            marginBottom: '40px'
          }}>
            {articles.map((a, i) => (
              <>
                <ArticleCard key={a.id} article={a} />
                {i === 5 && (
                  <div key="cat-ad" className="col-span-full my-4">
                    <AdUnit slot="9844142257" format="horizontal" />
                  </div>
                )}
              </>
            ))}
          </div>
        ) : (
          <p className="text-[#555] text-sm py-16 text-center">No articles found in this category.</p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-2 py-8">
            {page > 1 && (
              <Link href={`/${slug}?page=${page - 1}`} className="page-btn">‹</Link>
            )}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = i + 1
              return (
                <Link key={p} href={`/${slug}?page=${p}`}
                  className={`page-btn${p === page ? ' active' : ''}`}>
                  {p}
                </Link>
              )
            })}
            {totalPages > 7 && <span className="text-[#555] text-sm px-1">…</span>}
            {page < totalPages && (
              <Link href={`/${slug}?page=${page + 1}`} className="page-btn">›</Link>
            )}
          </nav>
        )}

      </div>
    </>
  )
}
