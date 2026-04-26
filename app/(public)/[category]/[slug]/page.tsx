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
import { PushSubscribeButton }  from '@/components/pwa/PushSubscribeButton'
import { ArticleImage }         from '@/components/article/ArticleImage'
import { HitTracker }           from '@/components/article/HitTracker'
import { ReadingProgress }      from '@/components/article/ReadingProgress'
import { ShareRail }            from '@/components/article/ShareRail'
import { NewsletterCTA }        from '@/components/common/NewsletterCTA'
import {
  getArticleBySlug,
  getRelatedArticles,
} from '@/lib/db/queries'
import { buildArticleMetadata }              from '@/lib/seo/metadata'
import { buildNewsArticleSchema, buildBreadcrumbSchema } from '@/lib/seo/schema'
import { formatDate, readingTime, formatHitCount, depthScore } from '@/lib/utils'
import { safeJsonArray } from '@/lib/utils/safe-json'
import { SITE_URL } from '@/lib/constants'
import type { ArticleWithRelations } from '@/lib/types'

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
  const featuredSrc = article.featuredImage ? article.featuredImage.split('#')[0].trim() : ''
  const countryTags = safeJsonArray<string>(article.countryTags)

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

      {/* ── CINEMATIC HERO ── */}
      <div
        className="article-hero grain"
        style={featuredSrc ? { backgroundImage: `url(${featuredSrc})` } : undefined}
      >
        {/* Fallback gradient when no image */}
        {!featuredSrc && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-base) 100%)' }} />
        )}

        <div style={{ width: '100%', maxWidth: '1380px', margin: '0 auto', padding: '0 24px' }}>
          {/* Back link */}
          <div style={{ marginBottom: 24 }}>
            <Link href={`/${catSlug}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)',
              textDecoration: 'none', transition: 'color 0.15s',
            }}>
              ← {article.category.name}
            </Link>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <span className="cat-pill">{article.category.name}</span>
            {article.isBreaking && (
              <span style={{ background: 'var(--gold)', color: '#000', fontSize: '0.58rem', fontWeight: 900, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                ⚡ Breaking
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> {minutes} min read
            </span>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>{depth}</span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(2rem, 5vw, 3.8rem)',
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            maxWidth: 900,
            marginBottom: 16,
          }}>
            {article.title}
          </h1>

          {/* Subtitle */}
          {article.subtitle && (
            <p style={{ fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', color: 'rgba(255,255,255,0.78)', maxWidth: 700, lineHeight: 1.55, marginBottom: 0 }}>
              {article.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '48px 24px 80px', display: 'flex', gap: '48px', alignItems: 'flex-start' }}>

        {/* ── LEFT: share rail + article body ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: '32px', maxWidth: '860px' }}>

            {/* Sticky share rail — desktop only */}
            <div className="hidden md:block">
              <ShareRail articleId={article.id} title={article.title} url={articleUrl} />
            </div>

            {/* Content column */}
            <div>

              {/* Author + meta header */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--brand), var(--gold))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-fraunces)', fontWeight: 900, color: '#fff', fontSize: '0.95rem',
                }}>
                  {article.author?.name
                    ? article.author.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')
                    : 'CC'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    {article.author?.name || 'Cameroon Concord'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={10} />{formatDate(article.publishedAt!)}</span>
                    {article.updatedAt && new Date(article.updatedAt).toDateString() !== new Date(article.publishedAt!).toDateString() && (
                      <span>· Updated {new Date(article.updatedAt).toLocaleDateString()}</span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{minutes} min read</span>
                    {article.hits > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--gold)' }}>
                        <Eye size={10} />{formatHitCount(article.hits)}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <FollowButton topicSlug={article.category.slug} topicName={article.category.name} />
                  <PushSubscribeButton />
                  <HeatScore articleId={article.id} />
                  <CCScore score={article.ccScore ?? null} />
                </div>
              </div>

              {/* Country tags */}
              {countryTags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                  {countryTags.map((t: string) => (
                    <span key={t} style={{ background: 'var(--gold-muted)', color: 'var(--gold)', fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Summary excerpt */}
              {article.excerpt && (
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderLeft: '4px solid var(--brand)', borderRadius: '0 8px 8px 0', padding: '16px 20px', marginBottom: 24 }}>
                  <p style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Summary</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{article.excerpt}</p>
                </div>
              )}

              {/* Quick summary bullets */}
              {article.summary && Array.isArray(article.summary) && article.summary.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderLeft: '4px solid var(--brand)', borderRadius: '0 8px 8px 0', padding: '16px 20px', marginBottom: 24 }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--brand)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>Quick Summary</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {article.summary.map((point: string, i: number) => (
                      <li key={i} style={{ display: 'flex', gap: 8, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <span style={{ color: 'var(--brand)', fontWeight: 700, flexShrink: 0 }}>•</span>
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

              {/* Featured image — only rendered if NOT used as hero (no featuredImage = card fallback is hero) */}
              {article.featuredImage && (
                <div style={{ marginBottom: 24 }}>
                  <ArticleImage
                    src={article.featuredImage}
                    alt={article.imageAlt || article.title}
                    caption={article.imageCaption}
                    priority={false}
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

              {/* Inline newsletter CTA — Lovable style */}
              <div style={{
                marginTop: 48, borderRadius: 16,
                border: '1px solid hsla(354,78%,50%,0.3)',
                background: 'hsla(354,78%,50%,0.05)',
                padding: '40px 32px', textAlign: 'center',
              }}>
                <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.2 }}>
                  Enjoyed this story?
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.6 }}>
                  Get The Concord Daily — six hand-picked stories every morning. Free.
                </p>
                <a href="#newsletter" style={{ display: 'inline-block', background: 'var(--brand)', color: '#fff', borderRadius: 24, padding: '12px 32px', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
                  Subscribe to the newsletter →
                </a>
              </div>

              {/* Discussion teaser */}
              <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                <span>💬</span>
                <span>Conversation closed for now — share your thoughts on social.</span>
              </div>

              {/* Mobile share row */}
              <div className="md:hidden" style={{ marginTop: 32, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <ShareRail articleId={article.id} title={article.title} url={articleUrl} />
                </div>
              </div>

              {/* Author card */}
              {article.author && (
                <div style={{ marginTop: 40, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                  <p style={{ fontSize: '0.58rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: 12 }}>About the Author</p>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {article.author.avatarUrl ? (
                      <img src={article.author.avatarUrl} alt={article.author.name} width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '0.9rem', flexShrink: 0 }}>
                        {article.author.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 4 }}>{article.author.name}</p>
                      {article.author.bio && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{article.author.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Comments */}
              <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <CommentsSection articleId={article.id} />
              </div>

            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR — desktop only ── */}
        <div className="hidden lg:block w-[300px] shrink-0">
          <div className="sticky top-4 flex flex-col gap-4">
            <AdUnit slot="5520370976" format="rectangle" />
            <StoryTimeline articleId={article.id} />
            <SubscribeForm source="article" />
          </div>
        </div>

      </div>

      {/* ── MORE STORIES FROM THE CONCORD ── */}
      {related.length > 0 && (
        <section style={{ maxWidth: '1200px', margin: '0 auto 80px', padding: '0 24px' }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--brand)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
              Continue Reading
            </div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 900, color: 'var(--text-primary)' }}>
              More stories from the Concord
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {related.map(a => (
              <ArticleCard key={a.id} article={a as unknown as ArticleWithRelations} />
            ))}
          </div>
        </section>
      )}

      {/* ── NEWSLETTER CTA ── */}
      <div id="newsletter" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>
        <NewsletterCTA />
      </div>
    </>
  )
}
