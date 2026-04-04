export const revalidate = 3600

import type { Metadata } from 'next'
import { notFound }      from 'next/navigation'
import Link              from 'next/link'
import { Eye, Clock, Calendar } from 'lucide-react'
import { ArticleCard }      from '@/components/article/ArticleCard'
import AdUnit               from '@/components/ads/AdUnit'
import { JsonLd }           from '@/components/seo/JsonLd'
import { CommentSection }   from '@/components/article/CommentSection'
import { ArticleImage }     from '@/components/article/ArticleImage'
import { HitTracker }       from '@/components/article/HitTracker'
import { ReadingProgress }  from '@/components/article/ReadingProgress'
import {
  getArticleBySlug,
  getRelatedArticles,
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

  const related = await getRelatedArticles(article.id, article.categoryId, 4)

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

      {/* Centered reading column — global container provides 1380px max-width */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '32px', paddingBottom: '64px' }}>
        <div style={{ display: 'flex', gap: '32px', maxWidth: '1060px', width: '100%', alignItems: 'flex-start' }}>
        <div style={{ maxWidth: '720px', width: '100%', display: 'flex', flexDirection: 'column', gap: '0' }}>

          {/* Breadcrumb — navigation path only, title is the H1 below */}
          <nav className="text-xs text-[#6B7280] mb-4 flex items-center gap-1">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>›</span>
            <Link href={`/${catSlug}`} className="hover:text-white transition-colors text-[#C8102E]">
              {article.category.name}
            </Link>
          </nav>

          {/* Category + Breaking badges */}
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
            <div className="mb-6">
              <ArticleImage
                src={article.featuredImage}
                alt={article.imageAlt || article.title}
                caption={article.imageCaption}
              />
            </div>
          )}

          {/* Article body — split after 3rd </p> for in-article ad */}
          <div className="prose" id="article-content">
            {article.body ? (() => {
              const parts = article.body.split('</p>')
              if (parts.length <= 3) {
                return <div dangerouslySetInnerHTML={{ __html: article.body }} />
              }
              const before = parts.slice(0, 3).join('</p>') + '</p>'
              const after  = parts.slice(3).join('</p>')
              return (
                <>
                  <div dangerouslySetInnerHTML={{ __html: before }} />
                  <div className="my-6 min-h-[250px]">
                    <AdUnit slot="5471720771" format="auto" />
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: after }} />
                </>
              )
            })() : (
              <p className="text-[#666]">Content unavailable.</p>
            )}
          </div>

          {/* Share bar */}
          <div style={{ borderTop: '1px solid #2A2A2A', borderBottom: '1px solid #2A2A2A', padding: '20px 0', margin: '32px 0' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', marginBottom: '8px' }}>
              SHARE THIS ARTICLE
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                         borderRadius: '999px', background: '#1877F2', color: '#fff', fontWeight: 600,
                         fontSize: '14px', textDecoration: 'none' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </a>
              <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                         borderRadius: '999px', background: '#000', border: '1px solid #333', color: '#fff',
                         fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
                </svg>
                X / Twitter
              </a>
              <a href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                         borderRadius: '999px', background: '#25D366', color: '#fff', fontWeight: 600,
                         fontSize: '14px', textDecoration: 'none' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
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

          {/* Comments */}
          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #222' }}>
            <CommentSection articleId={article.id} />
          </div>

        </div>

        {/* Sidebar — desktop only */}
        <div className="hidden lg:block w-[300px] shrink-0">
          <div className="sticky top-4 min-h-[250px]">
            <AdUnit slot="5520370976" format="rectangle" />
          </div>
        </div>

        </div>
      </div>
    </>
  )
}
