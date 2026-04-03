export const revalidate = 3600

import type { Metadata } from 'next'
import { notFound }      from 'next/navigation'
import Link              from 'next/link'
import { Eye, Clock, Calendar } from 'lucide-react'
import { ArticleCard }      from '@/components/article/ArticleCard'
import { JsonLd }           from '@/components/seo/JsonLd'
import { CommentSection }   from '@/components/article/CommentSection'
import { ArticleImage }     from '@/components/article/ArticleImage'
import { HitTracker }       from '@/components/article/HitTracker'
import { ReadingProgress }  from '@/components/article/ReadingProgress'
import {
  getArticleBySlug,
  getRelatedArticles,
  getMostRead,
} from '@/lib/db/queries'
import { buildArticleMetadata }              from '@/lib/seo/metadata'
import { buildNewsArticleSchema, buildBreadcrumbSchema } from '@/lib/seo/schema'
import { formatDate, readingTime, formatHitCount, depthScore } from '@/lib/utils'
import { SITE_URL } from '@/lib/constants'

interface Props { params: Promise<{ category: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params
  const article = await getArticleBySlug(category, slug)
  if (!article) return {}
  return buildArticleMetadata(article)
}

export default async function ArticlePage({ params }: Props) {
  const { category: catSlug, slug } = await params
  const article = await getArticleBySlug(catSlug, slug)
  if (!article) notFound()

  const [related, mostRead] = await Promise.all([
    getRelatedArticles(article.id, article.categoryId, 4),
    getMostRead(5),
  ])

  const minutes    = readingTime(article.body)
  const depth      = depthScore(article.body)
  const articleUrl = `${SITE_URL}/${catSlug}/${slug}`

  const newsSchema = buildNewsArticleSchema(article)
  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home',                url: SITE_URL },
    { name: article.category.name, url: `${SITE_URL}/${catSlug}` },
    { name: article.title,         url: articleUrl },
  ])

  const shareText = encodeURIComponent(article.title)
  const shareUrl  = encodeURIComponent(articleUrl)

  return (
    <>
      <JsonLd data={newsSchema} />
      <JsonLd data={breadcrumb} />
      <HitTracker articleId={article.id} />
      <ReadingProgress />

      {/* Outer wrapper — centred, responsive padding */}
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-6">

        {/* Two-column grid: fluid article + fixed 340px sidebar, single col on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-10 items-start">

          {/* MAIN ARTICLE */}
          <article>

            {/* Breadcrumb */}
            <nav className="text-xs text-[#6B7280] mb-4 flex items-center gap-1">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>›</span>
              <Link href={`/${catSlug}`} className="hover:text-white transition-colors text-[#C8102E]">
                {article.category.name}
              </Link>
              <span>›</span>
              <span className="text-[#9CA3AF] truncate max-w-[200px]">{article.title}</span>
            </nav>

            {/* Category + Breaking */}
            <div className="flex items-center gap-2 mb-3">
              <Link
                href={`/${catSlug}`}
                className="inline-block bg-[#C8102E] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded"
              >
                {article.category.name}
              </Link>
              {article.isBreaking && (
                <span className="inline-block bg-[#F5A623] text-black text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                  Breaking
                </span>
              )}
              <span className="text-[11px] text-[#6B7280] ml-auto">{depth}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-4xl font-black text-[#F5A623] leading-[1.1] tracking-[-0.03em] mb-3">
              {article.title}
            </h1>
            {article.subtitle && (
              <p className="text-lg text-[#9CA3AF] leading-snug mb-4">{article.subtitle}</p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B7280] pb-4 border-b border-[#2A2A2A] mb-5">
              <span className="font-semibold text-[#9CA3AF]">
                {article.author?.name || 'News Team'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {formatDate(article.publishedAt!)}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {minutes} min read
              </span>
              {article.hits > 0 && (
                <span className="flex items-center gap-1 text-[#F5A623] font-semibold">
                  <Eye size={11} />
                  {formatHitCount(article.hits)}
                </span>
              )}
            </div>

            {/* Summary box */}
            {article.excerpt && (
              <div className="bg-[#161616] border border-[#2A2A2A] border-l-4 border-l-[#C8102E] rounded-lg p-4 mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#C8102E] mb-2">Summary</p>
                <p className="text-sm text-[#9CA3AF] leading-relaxed">{article.excerpt}</p>
              </div>
            )}

            {/* Featured image */}
            {article.featuredImage && (
              <ArticleImage
                src={article.featuredImage}
                alt={article.imageAlt || article.title}
                caption={article.imageCaption}
              />
            )}

            {/* Article body */}
            <div className="prose" id="article-content">
              {article.body ? (
                <div dangerouslySetInnerHTML={{ __html: article.body }} />
              ) : (
                <p className="text-[#666]">Content unavailable.</p>
              )}
            </div>

            {/* Share bar */}
            <div style={{ borderTop: '1px solid #2A2A2A', borderBottom: '1px solid #2A2A2A', padding: '20px 0', margin: '32px 0' }}>
              <p className="text-xs font-black uppercase tracking-widest text-[#6B7280] mb-3">Share this article</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Share on Facebook
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Share on X
                </a>
                <a
                  href={`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Author card */}
            {article.author && (
              <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-5" style={{ marginBottom: '40px' }}>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#6B7280] mb-3">About the Author</p>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#C8102E] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {article.author.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{article.author.name}</p>
                    {article.author.bio && (
                      <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{article.author.bio}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Related articles */}
            {related.length > 0 && (
              <section style={{ marginBottom: '40px' }}>
                <h3 className="text-sm font-black uppercase tracking-widest text-white border-l-2 border-[#C8102E] pl-3 mb-4">
                  Related Articles
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {related.map(a => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </section>
            )}

            <CommentSection articleId={article.id} />

          </article>

          {/* SIDEBAR */}
          <aside className="space-y-8">

            {/* Most read */}
            <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-white border-l-2 border-[#F5A623] pl-3 mb-4">
                Most Read
              </h3>
              {mostRead.map((a, i) => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-[#2A2A2A] last:border-0">
                  <span className="text-2xl font-black text-[#2A2A2A] leading-none w-6 flex-shrink-0">
                    {i + 1}
                  </span>
                  <ArticleCard article={a} variant="compact" />
                </div>
              ))}
            </div>

          </aside>
        </div>
      </div>
    </>
  )
}
