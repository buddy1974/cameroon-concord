export const revalidate = 3600

import type { Metadata } from 'next'
import { notFound }      from 'next/navigation'
import Link              from 'next/link'
import { Eye, Clock, Calendar } from 'lucide-react'
import { ArticleCard }      from '@/components/article/ArticleCard'
import AdUnit               from '@/components/ads/AdUnit'
import { JsonLd }           from '@/components/seo/JsonLd'
import CommentsSection      from '@/components/article/CommentSection'
import SubscribeForm        from '@/components/newsletter/SubscribeForm'
import ShareButtons          from '@/components/article/ShareButtons'
import { ReactionBar }       from '@/components/article/ReactionBar'
import { FollowUpStories }   from '@/components/article/FollowUpStories'
import { LiveBlog }             from '@/components/article/LiveBlog'
import { AudioPlayer }          from '@/components/article/AudioPlayer'
import { PerspectiveEngine }    from '@/components/article/PerspectiveEngine'
import { ProgressiveBody }      from '@/components/article/ProgressiveBody'
import { HeatScore }            from '@/components/article/HeatScore'
import { FollowButton }         from '@/components/common/FollowButton'
import { EntityReference }      from '@/components/article/EntityReference'
import { CCScore }              from '@/components/article/CCScore'
import { StoryTimeline }        from '@/components/article/StoryTimeline'
import { PushSubscribeButton } from '@/components/pwa/PushSubscribeButton'
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
import { safeJsonArray } from '@/lib/utils/safe-json'
import { SITE_URL } from '@/lib/constants'
import { NewsletterCTA } from '@/components/common/NewsletterCTA'

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

          {/* Category + Breaking badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Link
              href={`/${catSlug}`}
              className="inline-block bg-[#C8102E] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded"
            >
              {article.category.name}
            </Link>
            <FollowButton topicSlug={article.category.slug} topicName={article.category.name} />
            {article.isBreaking && (
              <span className="inline-block bg-[#F5A623] text-black text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                Breaking
              </span>
            )}
            <span className="text-[11px] text-[#6B7280] ml-auto">{depth}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-4xl font-black text-[#F5A623] leading-[1.1] tracking-[-0.03em] mb-3" style={{ fontFamily: 'var(--font-fraunces)' }}>
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
            {article.updatedAt && new Date(article.updatedAt).toDateString() !== new Date(article.publishedAt!).toDateString() && (
              <span style={{ fontSize: '0.72rem', color: '#555', marginLeft: '8px' }}>
                Updated: {new Date(article.updatedAt).toLocaleDateString()}
              </span>
            )}
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
            {safeJsonArray<string>(article.countryTags).map((t: string) => (
              <span key={t} style={{ background: '#D4AF37', color: '#1A1A1A', fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t}
              </span>
            ))}
            <PushSubscribeButton />
            <HeatScore articleId={article.id} />
            <CCScore score={article.ccScore ?? null} />
          </div>

          {/* Summary box */}
          {article.excerpt && (
            <div className="bg-[#161616] border border-[#2A2A2A] border-l-4 border-l-[#C8102E] rounded-lg p-4 mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#C8102E] mb-2">Summary</p>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">{article.excerpt}</p>
            </div>
          )}

          {/* Quick Summary bullets */}
          {article.summary && Array.isArray(article.summary) && article.summary.length > 0 && (
            <div style={{ background: '#0F0F0F', border: '1px solid #C8102E', borderLeft: '4px solid #C8102E', borderRadius: '8px', padding: '16px 20px', margin: '20px 0' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#C8102E', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px' }}>Quick Summary</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {article.summary.map((point: string, i: number) => (
                  <li key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '0.85rem', color: '#ccc', lineHeight: 1.5 }}>
                    <span style={{ color: '#C8102E', fontWeight: 700, flexShrink: 0 }}>•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Live Blog */}
          <LiveBlog articleId={article.id} isLive={article.isLive ?? 0} liveEnded={article.liveEnded ?? 0} />

          {/* Audio player */}
          <AudioPlayer text={article.body} title={article.title} />

          {/* Perspective Engine */}
          <PerspectiveEngine articleId={article.id} categorySlug={article.category.slug} />

          {/* Featured image */}
          {article.featuredImage && (
            <div className="mb-6">
              <ArticleImage
                src={article.featuredImage}
                alt={article.imageAlt || article.title}
                caption={article.imageCaption}
                priority={true}
              />
            </div>
          )}

          {/* Article body */}
          <div className="prose prose-editorial" id="article-content">
            <ProgressiveBody html={article.body || ''} />
          </div>

          {/* Key terms reference */}
          <EntityReference body={article.body} />

          {/* Follow-up stories */}
          <FollowUpStories articleId={article.id} />

          {/* Reaction bar */}
          <ReactionBar articleId={article.id} />

          {/* Share bar */}
          <div style={{ borderTop: '1px solid #2A2A2A', borderBottom: '1px solid #2A2A2A', margin: '32px 0' }}>
            <ShareButtons
              title={article.title}
              categorySlug={article.category.slug}
              slug={article.slug}
            />
          </div>

          {/* Author card */}
          {article.author && (
            <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-5" style={{ marginBottom: '40px' }}>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#6B7280] mb-3">About the Author</p>
              <div className="flex items-start gap-3">
                {article.author.avatarUrl ? (
                  <img src={article.author.avatarUrl} alt={article.author.name} width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#C8102E] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {article.author.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white text-sm">{article.author.name}</p>
                  {article.author.bio && (
                    <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{article.author.bio}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Newsletter CTA */}
          <NewsletterCTA />

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
            <CommentsSection articleId={article.id} />
          </div>

        </div>

        {/* Sidebar — desktop only */}
        <div className="hidden lg:block w-[300px] shrink-0">
          <div className="sticky top-4 flex flex-col gap-4">
            <AdUnit slot="5520370976" format="rectangle" />
            <StoryTimeline articleId={article.id} />
            <SubscribeForm source="article" />
          </div>
        </div>

        </div>
      </div>
    </>
  )
}
