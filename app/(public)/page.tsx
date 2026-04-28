export const dynamic  = 'force-dynamic'
export const revalidate = 0

import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import AdUnit from '@/components/ads/AdUnit'
import { ArticleCard } from '@/components/article/ArticleCard'
import InstallBanner from '@/components/pwa/InstallBanner'
import { JsonLd } from '@/components/seo/JsonLd'
import { NewsletterCTA } from '@/components/common/NewsletterCTA'
import {
  getFeaturedArticles, getLatestArticles,
  getArticlesByCategory, getAllCategories,
} from '@/lib/db/queries'
import { buildSiteMetadata } from '@/lib/seo/metadata'
import { buildOrganizationSchema } from '@/lib/seo/schema'
import type { ArticleWithRelations, Category } from '@/lib/types'
import { readingTime, formatHitCount, formatDate } from '@/lib/utils'
import { db } from '@/lib/db/client'
import { articles, categories, authors } from '@/lib/db/schema'
import { eq, and, or, like, desc, inArray } from 'drizzle-orm'

export const metadata: Metadata = buildSiteMetadata()

function cleanImg(url: string | null | undefined): string {
  if (!url) return ''
  return url.split('#')[0].trim()
}

export default async function HomePage() {
  let featured: ArticleWithRelations[] = []
  let latest:   ArticleWithRelations[] = []
  let allCats:  Category[]             = []

  try {
    ;[featured, latest, allCats] = await Promise.all([
      getFeaturedArticles(7),
      getLatestArticles(18),
      getAllCategories(),
    ])
  } catch (err) {
    console.error('Homepage DB error:', err)
  }

  const hero = featured[0] ?? latest[0]
  const picks = featured.length >= 4 ? featured.slice(1, 4) : latest.slice(0, 3)
  const longRead = latest[0]
  const trending = latest.slice(0, 5)
  const grid = latest.slice(5, 13)

  const targetSlugs = ['politics', 'society', 'sportsnews', 'southern-cameroons', 'health', 'business']
  const availableSlugs = targetSlugs.filter(s => allCats.some(c => c.slug === s))

  let categoryRows: { slug: string; name: string; articles: ArticleWithRelations[] }[] = []
  try {
    categoryRows = await Promise.all(
      availableSlugs.slice(0, 4).map(async slug => {
        const cat = allCats.find(c => c.slug === slug)!
        const { articles: arts } = await getArticlesByCategory(cat.slug, 1, 4)
        return { slug: cat.slug, name: cat.name, articles: arts }
      })
    )
  } catch (err) {
    console.error('Category rows DB error:', err)
  }

  // Cameroon Focus section — fetch once, split into main + trending
  const cameroonRows = await db
    .select({
      id:           articles.id,
      title:        articles.title,
      slug:         articles.slug,
      excerpt:      articles.excerpt,
      featuredImage:articles.featuredImage,
      publishedAt:  articles.publishedAt,
      body:         articles.body,
      category:     { name: categories.name, slug: categories.slug },
      author:       { name: authors.name },
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(authors, eq(articles.authorId, authors.id))
    .where(
      and(
        eq(articles.status, 'published'),
        or(
          like(articles.title,   '%ameroon%'),
          like(articles.excerpt, '%ameroon%'),
          inArray(categories.slug, ['headlines', 'politics', 'society', 'southern-cameroons']),
        ),
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(6)
    .catch(() => [])

  const cameroonFeatured  = cameroonRows[0]
  const trendingArticles  = cameroonRows.slice(1, 6)

  // Top stories — one article per category column
  const topStorySelect = {
    id:           articles.id,
    title:        articles.title,
    slug:         articles.slug,
    excerpt:      articles.excerpt,
    featuredImage:articles.featuredImage,
    publishedAt:  articles.publishedAt,
    body:         articles.body,
    category:     { name: categories.name, slug: categories.slug },
    author:       { name: authors.name },
  }
  const [tsH, tsP, tsB, tsS, tsSoc, tsSC, tsL] = await Promise.all([
    db.select(topStorySelect).from(articles).innerJoin(categories, eq(articles.categoryId, categories.id)).leftJoin(authors, eq(articles.authorId, authors.id)).where(and(eq(articles.status, 'published'), eq(categories.slug, 'headlines'))).orderBy(desc(articles.publishedAt)).limit(1).then(r => r[0]),
    db.select(topStorySelect).from(articles).innerJoin(categories, eq(articles.categoryId, categories.id)).leftJoin(authors, eq(articles.authorId, authors.id)).where(and(eq(articles.status, 'published'), eq(categories.slug, 'politics'))).orderBy(desc(articles.publishedAt)).limit(1).then(r => r[0]),
    db.select(topStorySelect).from(articles).innerJoin(categories, eq(articles.categoryId, categories.id)).leftJoin(authors, eq(articles.authorId, authors.id)).where(and(eq(articles.status, 'published'), eq(categories.slug, 'business'))).orderBy(desc(articles.publishedAt)).limit(1).then(r => r[0]),
    db.select(topStorySelect).from(articles).innerJoin(categories, eq(articles.categoryId, categories.id)).leftJoin(authors, eq(articles.authorId, authors.id)).where(and(eq(articles.status, 'published'), eq(categories.slug, 'sportsnews'))).orderBy(desc(articles.publishedAt)).limit(1).then(r => r[0]),
    db.select(topStorySelect).from(articles).innerJoin(categories, eq(articles.categoryId, categories.id)).leftJoin(authors, eq(articles.authorId, authors.id)).where(and(eq(articles.status, 'published'), eq(categories.slug, 'society'))).orderBy(desc(articles.publishedAt)).limit(1).then(r => r[0]),
    db.select(topStorySelect).from(articles).innerJoin(categories, eq(articles.categoryId, categories.id)).leftJoin(authors, eq(articles.authorId, authors.id)).where(and(eq(articles.status, 'published'), eq(categories.slug, 'southern-cameroons'))).orderBy(desc(articles.publishedAt)).limit(1).then(r => r[0]),
    db.select(topStorySelect).from(articles).innerJoin(categories, eq(articles.categoryId, categories.id)).leftJoin(authors, eq(articles.authorId, authors.id)).where(and(eq(articles.status, 'published'), eq(categories.slug, 'lifestyle'))).orderBy(desc(articles.publishedAt)).limit(1).then(r => r[0]),
  ]).catch(() => [undefined, undefined, undefined, undefined, undefined, undefined, undefined] as const)
  const topStories = [tsH, tsP, tsB, tsS, tsSoc, tsSC, tsL].filter((x): x is NonNullable<typeof tsH> => x != null)

  const heroSrc = hero ? cleanImg(hero.featuredImage) : ''
  const heroMins = hero ? readingTime(hero.body) : 0

  return (
    <>
      <JsonLd data={buildOrganizationSchema()} />

      {/* ── CINEMATIC HERO (HeroFeature equivalent) ── */}
      {hero && (
        <section className="grain" style={{ position: 'relative', marginTop: '-2px' }}>
          <div style={{ position: 'relative', height: 'max(88vh, 640px)', width: '100%', overflow: 'hidden' }}>
            {heroSrc && (
              <img src={heroSrc} alt={hero.title} loading="eager"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            {/* Vertical fade */}
            <div className="bg-hero-fade" style={{ position: 'absolute', inset: 0 }} />
            {/* Horizontal fade left */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, hsl(222 15% 7% / 0.9) 0%, hsl(222 15% 7% / 0.3) 50%, transparent 100%)' }} />

            <div style={{ position: 'relative', zIndex: 10, height: '100%', maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 'clamp(48px, 8vh, 96px)' }}>
              <div className="animate-fade-up" style={{ maxWidth: 720 }}>
                {/* Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                  <span className="kicker" style={{ background: 'hsl(354 78% 50% / 0.15)', padding: '4px 12px', borderRadius: 9999 }}>
                    {hero.category.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(0 0% 65%)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {heroMins} min read
                  </span>
                </div>

                {/* Title */}
                <h1 style={{ fontFamily: 'var(--font-roboto)', fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', fontWeight: 900, lineHeight: 1.02, letterSpacing: '-0.02em', marginBottom: 20, color: '#fff' }}>
                  {hero.title}
                </h1>

                {/* Excerpt */}
                {hero.excerpt && (
                  <p style={{ fontSize: 'clamp(1rem, 1.5vw, 1.15rem)', color: 'hsl(0 0% 78%)', lineHeight: 1.6, maxWidth: 600, marginBottom: 32 }}>
                    {hero.excerpt}
                  </p>
                )}

                {/* CTA */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
                  <Link href={`/${hero.category.slug}/${hero.slug}`}
                    style={{ background: 'hsl(354 78% 50%)', color: '#fff', borderRadius: 9999, padding: '14px 28px', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 0 24px hsl(354 78% 50% / 0.4)' }}>
                    Read the full story →
                  </Link>
                  {hero.author && (
                    <span style={{ fontSize: '0.85rem', color: 'hsl(0 0% 58%)' }}>
                      By <span style={{ color: 'hsl(0 0% 80%)' }}>{hero.author.name}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── NEWS TICKER ── */}
      {latest.length > 0 && (
        <div style={{ borderTop: '1px solid hsl(var(--border))', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(222 15% 7% / 0.6)' }}>
          <div style={{ position: 'relative', display: 'flex', overflow: 'hidden', padding: '10px 0' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 10, width: 80, background: 'linear-gradient(to right, hsl(222 15% 7%), transparent)' }} />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 10, width: 80, background: 'linear-gradient(to left, hsl(222 15% 7%), transparent)' }} />
            <div className="animate-marquee" style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 48, padding: '0 24px', whiteSpace: 'nowrap' }}>
              {[...latest.slice(0, 6), ...latest.slice(0, 6)].map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.85rem' }}>
                  <span className="kicker">Live</span>
                  <Link href={`/${a.category.slug}/${a.slug}`} style={{ color: 'hsl(var(--muted-foreground))', textDecoration: 'none' }}>{a.title}</Link>
                  <span style={{ color: 'hsl(var(--primary))' }}>•</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TOP STORIES (4 cols by category) ── */}
      {topStories.length > 0 && (
        <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '80px 24px 0' }}>
          {/* Header — single line */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: '0.58rem', fontWeight: 800, color: 'hsl(var(--primary))', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Editor&apos;s Picks
              </span>
              <h2 style={{ fontFamily: 'var(--font-roboto)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, lineHeight: 1.1, color: 'hsl(var(--foreground))', margin: 0 }}>
                Our Top Stories on Cameroon Concord This Week
              </h2>
            </div>
            <Link href="/headlines" className="hidden md:inline-flex link-underline"
              style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
              All headlines →
            </Link>
          </div>

          {/* 4-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 20 }}>
            {topStories.map(a => (
              <Link key={a.id} href={`/${a.category.slug}/${a.slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', height: '100%' }} className="card-lift">
                {/* Image */}
                <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: 'hsl(220 14% 14%)', flexShrink: 0 }}>
                  {cleanImg(a.featuredImage) && (
                    <img src={cleanImg(a.featuredImage) ?? ''} alt={a.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 600ms ease' }} />
                  )}
                  {/* Category badge — bottom-left */}
                  <div style={{ position: 'absolute', bottom: 8, left: 8 }}>
                    <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'hsl(var(--primary))', color: '#fff', padding: '2px 8px', borderRadius: 4 }}>
                      {a.category.name}
                    </span>
                  </div>
                </div>
                {/* Title */}
                <div style={{ padding: '16px 16px 4px', flex: 1 }}>
                  <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--card-foreground))', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                    {a.title}
                  </h3>
                </div>
                {/* Excerpt */}
                {a.excerpt && (
                  <p style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', padding: '0 16px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                    {a.excerpt}
                  </p>
                )}
                {/* Footer */}
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid hsl(var(--border))', marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                    {a.author?.name || 'Cameroon Concord'}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'hsl(var(--muted-foreground))', display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    <Clock size={10} /> {readingTime(a.body)} min
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── CAMEROON FOCUS ── */}
      {(cameroonFeatured || trendingArticles.length > 0) && (
        <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '96px 24px 0' }}>
          {/* Section header */}
          <div style={{ marginBottom: 40 }}>
            <div className="kicker">Cameroon Focus</div>
            <h2 style={{ fontFamily: 'var(--font-roboto)', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900, marginTop: 12, lineHeight: 1.15, color: 'hsl(var(--foreground))' }}>
              Minute by Minute: News Across Cameroon
            </h2>
          </div>

          {/* Equal-height grid: main card | trending list */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, alignItems: 'stretch' }}
            className="lg:grid-cols-[1fr_380px]">

            {/* LEFT — main article */}
            {cameroonFeatured && (
              <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                {cleanImg(cameroonFeatured.featuredImage) && (
                  <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden', background: 'hsl(220 14% 14%)', flexShrink: 0 }}>
                    <img src={cleanImg(cameroonFeatured.featuredImage) ?? ''} alt={cameroonFeatured.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, hsl(220 14% 10% / 0.7) 0%, transparent 50%)' }} />
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <span className="kicker" style={{ background: 'hsl(222 15% 7% / 0.8)', backdropFilter: 'blur(8px)', padding: '3px 10px', borderRadius: 9999 }}>
                        {cameroonFeatured.category.name}
                      </span>
                    </div>
                  </div>
                )}
                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(1.2rem, 2vw, 1.6rem)', fontWeight: 700, color: 'hsl(var(--card-foreground))', lineHeight: 1.3 }}>
                    {cameroonFeatured.title}
                  </h3>
                  {cameroonFeatured.excerpt && (
                    <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {cameroonFeatured.excerpt}
                    </p>
                  )}
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid hsl(var(--border))' }}>
                    <Link href={`/${cameroonFeatured.category.slug}/${cameroonFeatured.slug}`}
                      style={{ background: 'hsl(var(--primary))', color: '#fff', borderRadius: 9999, padding: '10px 22px', fontWeight: 600, textDecoration: 'none', fontSize: '0.82rem' }}>
                      Read story →
                    </Link>
                    <span style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {readingTime(cameroonFeatured.body)} min read
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* RIGHT — trending list */}
            {trendingArticles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 16, overflow: 'hidden', padding: '20px' }}>
                <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.9rem' }}>🔥</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'hsl(var(--primary))', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Trending Now</span>
                </div>
                {trendingArticles.map((a, i) => (
                  <Link key={a.id} href={`/${a.category.slug}/${a.slug}`}
                    style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: i < trendingArticles.length - 1 ? '1px solid hsl(var(--border))' : 'none', textDecoration: 'none', flex: 1 }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'hsl(354 78% 50% / 0.4)', fontFamily: 'var(--font-fraunces)', minWidth: 28, flexShrink: 0 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                        {a.category.name}
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--card-foreground))', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {a.title}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
                        {readingTime(a.body)} min · {a.publishedAt ? formatDate(a.publishedAt) : ''}
                      </div>
                    </div>
                    {cleanImg(a.featuredImage) && (
                      <img src={cleanImg(a.featuredImage) ?? ''} alt=""
                        style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── INSTALL BANNER ── */}
      <div style={{ maxWidth: '1400px', margin: '80px auto 0', padding: '0 24px' }}>
        <InstallBanner />
      </div>

      {/* ── AD UNIT ── */}
      <div style={{ maxWidth: '728px', margin: '0 auto 48px', padding: '0 24px' }}>
        <AdUnit slot="9844142257" format="horizontal" />
      </div>

      {/* ── ACROSS THE COUNTRY ── */}
      {grid.length > 0 && (
        <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 32px' }}>
          <div style={{ marginBottom: 40 }}>
            <div className="kicker">Across the World</div>
            <h2 style={{ fontFamily: 'var(--font-roboto)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, marginTop: 12, lineHeight: 1.1, color: 'hsl(var(--foreground))' }}>
              Stories From Cameroon and Beyond
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 32 }}>
            {grid.map(a => <ArticleCard key={a.id} article={a} />)}
          </div>
        </section>
      )}

      {/* ── CATEGORY ROWS ── */}
      {categoryRows.map(row => row.articles.length > 0 && (
        <section key={row.slug} style={{ maxWidth: '1400px', margin: '0 auto', padding: '64px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <div className="kicker">{row.name}</div>
            <div style={{ flex: 1, height: 1, background: 'hsl(var(--border))' }} />
            <Link href={`/${row.slug}`}
              style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--primary))', textDecoration: 'none' }}>
              See all →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {row.articles.map(a => <ArticleCard key={a.id} article={a} />)}
          </div>
        </section>
      ))}

      {/* ── SUBSCRIBE BLOCK ── */}
      <section id="newsletter" style={{ position: 'relative', margin: '80px 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
          <div className="grain" style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, border: '1px solid hsl(var(--border))', background: 'hsl(220 14% 10%)', padding: 'clamp(32px, 6vw, 64px)', boxShadow: '0 30px 60px hsl(0 0% 0% / 0.4)' }}>
            {/* Glow blobs */}
            <div style={{ position: 'absolute', top: -128, right: -128, width: 320, height: 320, borderRadius: '50%', background: 'hsl(354 78% 50% / 0.15)', filter: 'blur(48px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -128, left: -128, width: 320, height: 320, borderRadius: '50%', background: 'hsl(43 74% 60% / 0.08)', filter: 'blur(48px)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr', gap: 48 }} className="md:grid-cols-2 md:items-center">
              <div>
                <div className="kicker">The Concord Daily</div>
                <h2 style={{ fontFamily: 'var(--font-roboto)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, marginTop: 16, lineHeight: 1.15, color: 'hsl(var(--foreground))' }}>
                  The story of Cameroon, before the rest of the world wakes up.
                </h2>
                <p style={{ marginTop: 20, fontSize: '1.05rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.7 }}>
                  Six stories. Hand-picked by our editors. Delivered every morning at 6 a.m. WAT. No fluff, no spam — just the country, in focus.
                </p>
                <ul style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    "In-depth analysis you won't find anywhere else",
                    "Exclusive newsletters from the field",
                    "Free for life — supported by readers like you",
                  ].map(b => (
                    <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.9rem', color: 'hsl(var(--secondary-foreground))' }}>
                      <span style={{ color: 'hsl(var(--primary))', flexShrink: 0, marginTop: 2 }}>✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <NewsletterCTA />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
