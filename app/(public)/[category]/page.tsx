export const revalidate = 120

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArticleCard } from '@/components/article/ArticleCard'
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

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home',        url: SITE_URL },
    { name: category.name, url: `${SITE_URL}/${slug}` },
  ])

  return (
    <>
      <JsonLd data={breadcrumb} />
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-8">

        {/* Category header */}
        <div className="mb-8 pb-6 border-b border-[#1E1E1E]">
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

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2">
            {articles[0] && (
              <div className="mb-5">
                <ArticleCard article={articles[0]} variant="featured" priority />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {articles.slice(1).map(a => <ArticleCard key={a.id} article={a} />)}
            </div>
          </div>
          <aside />
        </div>

        {/* PAGINATION */}
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
