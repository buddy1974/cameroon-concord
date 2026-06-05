export const revalidate = 120

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Clock } from 'lucide-react'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleCard } from '@/components/article/ArticleCard'
import AdUnit from '@/components/ads/AdUnit'
import { getArticlesByCategory } from '@/lib/db/queries'
import { buildBreadcrumbSchema } from '@/lib/seo/schema'
import { siteSpecials } from '@/lib/site-specials'
import { SITE_URL } from '@/lib/constants'
import { readingTime, formatDate } from '@/lib/utils'
import type { ArticleWithRelations } from '@/lib/types'

const { worldCup } = siteSpecials

export const metadata: Metadata = {
  title: worldCup.metaTitle,
  description: worldCup.metaDesc,
  openGraph: {
    title: worldCup.metaTitle,
    description: worldCup.metaDesc,
    url: `${SITE_URL}${worldCup.href}`,
    siteName: 'Cameroon Concord',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: worldCup.metaTitle,
    description: worldCup.metaDesc,
  },
  alternates: {
    canonical: `${SITE_URL}${worldCup.href}`,
  },
}

function cleanImg(url: string | null | undefined): string {
  if (!url) return ''
  return url.split('#')[0].trim()
}

// Sub-section filter — articles whose countryTags or title contain a keyword
function filterByTag(articles: ArticleWithRelations[], keywords: string[]): ArticleWithRelations[] {
  const kw = keywords.map(k => k.toLowerCase())
  return articles.filter(a => {
    const text = `${a.title} ${a.excerpt ?? ''}`.toLowerCase()
    const tags = Array.isArray((a as Record<string, unknown>).countryTags)
      ? ((a as Record<string, unknown>).countryTags as string[]).join(' ').toLowerCase()
      : ''
    return kw.some(k => text.includes(k) || tags.includes(k))
  })
}

export default async function WorldCupPage() {
  let allArticles: ArticleWithRelations[] = []
  let total = 0

  try {
    const result = await getArticlesByCategory(worldCup.categorySlug, 1, 40)
    allArticles = result.articles
    total = result.total
  } catch {
    allArticles = []
    total = 0
  }

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home',         url: SITE_URL },
    { name: worldCup.label, url: `${SITE_URL}${worldCup.href}` },
  ])

  // Split into sub-sections
  const lead      = allArticles[0] ?? null
  const latest    = allArticles.slice(1, 7)
  const cameroon  = filterByTag(allArticles, ['cameroon', 'indomitable', 'lions', 'fecafoot'])
  const africa    = filterByTag(allArticles, ['africa', 'african', 'caf', 'ghana', 'nigeria', 'senegal', 'morocco', 'egypt', 'mali', 'côte d\'ivoire', 'ivory coast'])
  const diaspora  = filterByTag(allArticles, ['diaspora', 'europe', 'fan', 'watch party', 'diaspora football'])
  const analysis  = filterByTag(allArticles, ['analysis', 'opinion', 'politics', 'fifa', 'editorial'])

  // For sub-sections, limit to 4 and deduplicate from the already-shown set
  const shownIds = new Set([lead?.id, ...latest.map(a => a.id)])
  const dedupe = (arr: ArticleWithRelations[]) => arr.filter(a => !shownIds.has(a.id)).slice(0, 4)

  return (
    <>
      <JsonLd data={breadcrumb} />

      <div style={{ paddingTop: 40, paddingBottom: 64 }}>

        {/* ── Page header ── */}
        <div style={{
          marginBottom: 48,
          paddingBottom: 32,
          borderBottom: '2px solid hsl(133 61% 18%)',
        }}>
          <nav style={{
            fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))',
            marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }} className="hover:text-white transition-colors">
              Home
            </Link>
            <span>›</span>
            <span style={{ color: 'hsl(133 61% 50%)', fontWeight: 600 }}>World Cup Special</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: '1.6rem' }}>⚽</span>
                <span style={{
                  fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: 'hsl(133 61% 50%)',
                  background: 'hsl(133 61% 10%)',
                  padding: '4px 10px', borderRadius: 4,
                }}>
                  Special Desk · 2026
                </span>
                {!worldCup.active && (
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'hsl(var(--muted-foreground))',
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    padding: '4px 10px', borderRadius: 4,
                  }}>
                    Archive
                  </span>
                )}
              </div>
              <h1 style={{
                fontFamily: 'var(--font-roboto)',
                fontSize: 'clamp(2.4rem, 6vw, 4rem)',
                fontWeight: 900, lineHeight: 1,
                color: 'hsl(var(--foreground))',
                position: 'relative', display: 'inline-block',
                marginBottom: 16,
              }}>
                World Cup Special
                <span style={{
                  position: 'absolute', bottom: -8, left: 0,
                  width: '55%', height: 3,
                  background: 'hsl(133 61% 35%)', borderRadius: 2,
                }} />
              </h1>
              <p style={{
                fontSize: 'clamp(0.9rem, 1.5vw, 1.1rem)',
                color: 'hsl(var(--muted-foreground))', lineHeight: 1.65,
                maxWidth: 640, marginTop: 8,
              }}>
                African teams, Cameroon angles, diaspora football stories, and the politics of the game.
                {total > 0 && (
                  <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85em' }}>
                    {' '}— {total.toLocaleString()} {total === 1 ? 'story' : 'stories'} published.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ── Empty state ── */}
        {allArticles.length === 0 && (
          <div style={{
            padding: '64px 32px', textAlign: 'center',
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))', borderRadius: 20,
          }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: 16 }}>⚽</span>
            <h2 style={{
              fontFamily: 'var(--font-roboto)', fontSize: '1.4rem', fontWeight: 900,
              color: 'hsl(var(--foreground))', marginBottom: 12,
            }}>
              Coverage coming soon
            </h2>
            <p style={{ fontSize: '1rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
              World Cup coverage will appear here as stories are published. Check back for African teams, Cameroon angles, and diaspora football stories.
            </p>
            <Link href="/" style={{
              display: 'inline-block', marginTop: 24,
              background: 'hsl(133 61% 20%)', color: 'hsl(133 61% 65%)',
              padding: '12px 28px', borderRadius: 9999, fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem',
            }}>
              ← Back to homepage
            </Link>
          </div>
        )}

        {/* ── Lead story ── */}
        {lead && (
          <section style={{ marginBottom: 64 }}>
            <Link
              href={`/${lead.category.slug}/${lead.slug}`}
              style={{ display: 'block', textDecoration: 'none', borderRadius: 20, overflow: 'hidden', position: 'relative' }}
              className="card-lift"
            >
              <div style={{ position: 'relative', aspectRatio: '21/9', minHeight: 280, background: 'hsl(133 61% 6%)' }}>
                {cleanImg(lead.featuredImage) && (
                  <Image
                    src={cleanImg(lead.featuredImage)}
                    alt={lead.title} fill priority
                    sizes="(max-width: 768px) 100vw, 1400px"
                    style={{ objectFit: 'cover' }}
                  />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, hsl(133 40% 4% / 0.95) 0%, hsl(133 40% 4% / 0.4) 50%, transparent 100%)' }} />
                <div style={{ position: 'absolute', top: 20, left: 20 }}>
                  <span style={{
                    fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em',
                    background: 'hsl(133 61% 20% / 0.9)', color: 'hsl(133 61% 65%)',
                    padding: '4px 10px', borderRadius: 4, backdropFilter: 'blur(8px)',
                  }}>
                    World Cup Special
                  </span>
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(24px, 4vw, 48px)' }}>
                  <h2 style={{
                    fontFamily: 'var(--font-roboto)',
                    fontSize: 'clamp(1.6rem, 4vw, 3rem)',
                    fontWeight: 900, lineHeight: 1.08,
                    color: '#fff', letterSpacing: '-0.02em', marginBottom: 12,
                  }}>
                    {lead.title}
                  </h2>
                  {lead.excerpt && (
                    <p style={{
                      fontSize: 'clamp(0.88rem, 1.4vw, 1.05rem)',
                      color: 'hsl(0 0% 75%)', lineHeight: 1.6, maxWidth: 640, marginBottom: 16,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {lead.excerpt}
                    </p>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'hsl(0 0% 55%)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {lead.author && <span>By {lead.author.name}</span>}
                    <span>·</span>
                    <Clock size={11} />
                    <span>{readingTime(lead.body)} min read</span>
                    {lead.publishedAt && (
                      <><span>·</span><span>{formatDate(lead.publishedAt)}</span></>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* ── Latest World Cup stories ── */}
        {latest.length > 0 && (
          <section style={{ marginBottom: 72 }}>
            <SectionHeading label="Latest" title="All World Cup Stories" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
              {latest.map(a => <ArticleCard key={a.id} article={a} />)}
            </div>
          </section>
        )}

        {/* ── Ad unit ── */}
        {allArticles.length > 0 && (
          <div style={{ maxWidth: 728, margin: '0 auto 64px' }}>
            <AdUnit slot="9844142257" format="horizontal" />
          </div>
        )}

        {/* ── Cameroon Watch ── */}
        <SubSection
          title="Cameroon Watch"
          subtitle="The Indomitable Lions, FECAFOOT, and Cameroon's World Cup journey."
          articles={dedupe(cameroon)}
          emptyText="No Cameroon-specific stories yet. Check back as coverage develops."
        />

        {/* ── African Teams ── */}
        <SubSection
          title="African Teams"
          subtitle="All 6 African nations at the World Cup — results, analysis, and reaction."
          articles={dedupe(africa)}
          emptyText="African teams coverage will appear here."
        />

        {/* ── Diaspora & Europe ── */}
        <SubSection
          title="Diaspora & Fan Reaction"
          subtitle="Watch parties, diaspora voices, and African fan culture on the global stage."
          articles={dedupe(diaspora)}
          emptyText="Diaspora and fan stories will appear here."
        />

        {/* ── Analysis & Politics ── */}
        <SubSection
          title="Analysis & Politics"
          subtitle="The geopolitics of football — FIFA governance, African football politics, and opinion."
          articles={dedupe(analysis)}
          emptyText="Opinion and analysis will appear here."
        />

      </div>
    </>
  )
}

// ── Shared sub-components ──────────────────────────────────────────────────

function SectionHeading({ label, title }: { label: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{
          fontSize: '0.55rem', fontWeight: 800, color: 'hsl(133 61% 45%)',
          letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>
          {label}
        </span>
        <h2 style={{
          fontFamily: 'var(--font-roboto)',
          fontSize: 'clamp(1.2rem, 2.5vw, 1.7rem)',
          fontWeight: 900, color: 'hsl(var(--foreground))', lineHeight: 1.15, margin: 0,
        }}>
          {title}
        </h2>
      </div>
      <div style={{ flex: 1, height: 1, background: 'hsl(133 61% 14%)' }} />
    </div>
  )
}

function SubSection({
  title, subtitle, articles, emptyText,
}: {
  title: string
  subtitle: string
  articles: ArticleWithRelations[]
  emptyText: string
}) {
  return (
    <section style={{ marginBottom: 72 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <span style={{
            fontSize: '0.55rem', fontWeight: 800, color: 'hsl(133 61% 45%)',
            letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>
            World Cup
          </span>
          <div style={{ flex: 1, height: 1, background: 'hsl(133 61% 12%)' }} />
        </div>
        <h2 style={{
          fontFamily: 'var(--font-roboto)',
          fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)',
          fontWeight: 900, color: 'hsl(var(--foreground))', lineHeight: 1.15,
          marginBottom: 8,
        }}>
          {title}
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
          {subtitle}
        </p>
      </div>

      {articles.length === 0 ? (
        <p style={{
          fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))',
          padding: '24px 0', borderTop: '1px solid hsl(var(--border) / 0.5)',
          fontStyle: 'italic',
        }}>
          {emptyText}
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 22 }}>
          {articles.map(a => <ArticleCard key={a.id} article={a} />)}
        </div>
      )}
    </section>
  )
}
