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
  getMostRead, getArticlesByCategory, getAllCategories,
} from '@/lib/db/queries'
import { buildSiteMetadata } from '@/lib/seo/metadata'
import { buildOrganizationSchema } from '@/lib/seo/schema'
import type { ArticleWithRelations, Category } from '@/lib/types'
import { readingTime, formatHitCount } from '@/lib/utils'

export const metadata: Metadata = buildSiteMetadata()

function cleanImg(url: string | null | undefined): string {
  if (!url) return ''
  return url.split('#')[0].trim()
}

export default async function HomePage() {
  let featured:     ArticleWithRelations[] = []
  let latest:       ArticleWithRelations[] = []
  let mostRead:     ArticleWithRelations[] = []
  let allCats:      Category[]             = []

  try {
    ;[featured, latest, mostRead, allCats] = await Promise.all([
      getFeaturedArticles(7),
      getLatestArticles(18),
      getMostRead(5),
      getAllCategories(),
    ])
  } catch (err) {
    console.error('Homepage DB error:', err)
  }

  const hero = featured[0] ?? latest[0]
  const picks = featured.length >= 4 ? featured.slice(1, 4) : latest.slice(0, 3)
  const longRead = latest[0]
  const trending = latest.slice(0, 5)
  const grid = latest.slice(5, 11)

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
                <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(2.2rem, 5vw, 4.2rem)', fontWeight: 900, lineHeight: 1.02, letterSpacing: '-0.02em', marginBottom: 20, color: '#fff' }}>
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

      {/* ── EDITOR'S PICKS ── */}
      {picks.length > 0 && (
        <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '80px 24px 0' }}>
          <div style={{ marginBottom: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div className="kicker">Editor&apos;s Picks</div>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, marginTop: 12, lineHeight: 1.1, color: 'hsl(var(--foreground))' }}>
                Our Top Stories on Cameroon Concord This Week
              </h2>
            </div>
            <Link href="/headlines" className="hidden md:inline-flex link-underline"
              style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              All headlines →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 32 }}>
            {picks.map(a => <ArticleCard key={a.id} article={a} />)}
          </div>
        </section>
      )}

      {/* ── LONG READ + TRENDING ── */}
      {(longRead || trending.length > 0) && (
        <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '96px 24px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48 }} className="lg:grid-cols-3">

            {/* Long read */}
            {longRead && (
              <div style={{ gridColumn: 'span 2' }}>
                <div className="kicker">Long Read</div>
                <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 900, marginTop: 12, marginBottom: 32, lineHeight: 1.2, color: 'hsl(var(--foreground))' }}>
                  In-depth analysis from the newsroom
                </h2>
                <ArticleCard article={longRead} variant="featured" />
              </div>
            )}

            {/* Trending sidebar */}
            {trending.length > 0 && (
              <aside>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
                  <span>🔥</span>
                  <div className="kicker">Trending Now</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {trending.map((a, i) => (
                    <div key={a.id} style={{ display: 'flex', gap: 16 }}>
                      <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: '1.8rem', fontWeight: 900, color: 'hsl(354 78% 50% / 0.6)', lineHeight: 1, width: 32, flexShrink: 0, paddingTop: 4 }}>
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <ArticleCard article={a} variant="horizontal" />
                    </div>
                  ))}
                </div>
              </aside>
            )}
          </div>
        </section>
      )}

      {/* ── INSTALL BANNER ── */}
      <div style={{ maxWidth: '1400px', margin: '80px auto 0', padding: '0 24px' }}>
        <InstallBanner />
      </div>

      {/* ── SUBSCRIBE BLOCK ── */}
      <section style={{ position: 'relative', margin: '80px 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
          <div className="grain" style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, border: '1px solid hsl(var(--border))', background: 'hsl(220 14% 10%)', padding: 'clamp(32px, 6vw, 64px)', boxShadow: '0 30px 60px hsl(0 0% 0% / 0.4)' }}>
            {/* Glow blobs */}
            <div style={{ position: 'absolute', top: -128, right: -128, width: 320, height: 320, borderRadius: '50%', background: 'hsl(354 78% 50% / 0.15)', filter: 'blur(48px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -128, left: -128, width: 320, height: 320, borderRadius: '50%', background: 'hsl(43 74% 60% / 0.08)', filter: 'blur(48px)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr', gap: 48 }} className="md:grid-cols-2 md:items-center">
              <div>
                <div className="kicker">The Concord Daily</div>
                <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, marginTop: 16, lineHeight: 1.15, color: 'hsl(var(--foreground))' }}>
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

      {/* ── AD UNIT ── */}
      <div style={{ maxWidth: '728px', margin: '0 auto 48px', padding: '0 24px' }}>
        <AdUnit slot="9844142257" format="horizontal" />
      </div>

      {/* ── ACROSS THE COUNTRY ── */}
      {grid.length > 0 && (
        <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 32px' }}>
          <div style={{ marginBottom: 40 }}>
            <div className="kicker">More from the Concord</div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, marginTop: 12, lineHeight: 1.1, color: 'hsl(var(--foreground))' }}>
              Across the country
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 32 }}>
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

      {/* ── MOST READ (sidebar content, now inline) ── */}
      {mostRead.length > 0 && (
        <section style={{ maxWidth: '1400px', margin: '64px auto 0', padding: '0 24px 80px' }}>
          <div className="kicker" style={{ marginBottom: 24 }}>Most Read</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {mostRead.map((a, i) => (
              <ArticleCard key={a.id} article={a} variant="list" index={i} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
