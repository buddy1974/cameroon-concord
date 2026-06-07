/**
 * WorldCupSection — Homepage block for the World Cup Special editorial desk.
 * Visibility is controlled by siteSpecials.worldCup in lib/site-specials.ts.
 * Server component — fetches its own data.
 */
import Link from 'next/link'
import Image from 'next/image'
import { Clock } from 'lucide-react'
import { siteSpecials } from '@/lib/site-specials'
import { getArticlesByCategory } from '@/lib/db/queries'
import { readingTime, formatDate } from '@/lib/utils'
import type { ArticleWithRelations } from '@/lib/types'

function cleanImg(url: string | null | undefined): string {
  if (!url) return ''
  return url.split('#')[0].trim()
}

export async function WorldCupSection() {
  const { worldCup } = siteSpecials

  // Gated by config — when active is false, render nothing
  if (!worldCup.active || !worldCup.showOnHomepage) return null

  let articles: ArticleWithRelations[] = []
  try {
    const result = await getArticlesByCategory(
      worldCup.categorySlug,
      1,
      worldCup.homepageArticleCount
    )
    articles = result.articles
  } catch {
    // DB not yet seeded with category — show empty state gracefully
    articles = []
  }

  return (
    <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '80px 24px 0' }}>

      {/* ── Section header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        marginBottom: 32,
        paddingBottom: 20,
        borderBottom: '2px solid hsl(133 61% 20% / 0.6)',
      }}>
        {/* Flag + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>⚽</span>
          <span style={{
            fontSize: '0.58rem', fontWeight: 800,
            color: 'hsl(133 61% 45%)',
            letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>
            Special Desk
          </span>
        </div>

        {/* Title + subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{
            fontFamily: 'var(--font-roboto)',
            fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
            fontWeight: 900, lineHeight: 1.1,
            color: 'hsl(var(--foreground))', margin: 0,
          }}>
            {worldCup.label}
            <span style={{
              marginLeft: 10,
              fontSize: '0.58rem', fontWeight: 700,
              color: 'hsl(133 61% 45%)',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              verticalAlign: 'middle',
              background: 'hsl(133 61% 12%)',
              padding: '3px 8px', borderRadius: 4,
            }}>
              2026
            </span>
          </h2>
          <p style={{
            fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))',
            marginTop: 4, lineHeight: 1.4,
          }}>
            African teams, Cameroon angles, diaspora football stories, and the politics of the game.
          </p>
        </div>

        {/* View all link */}
        <Link
          href={worldCup.href}
          style={{
            flexShrink: 0,
            fontSize: '0.78rem', fontWeight: 700,
            color: 'hsl(133 61% 45%)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}
          className="hidden md:inline-flex"
        >
          All World Cup coverage →
        </Link>
      </div>

      {/* ── Article grid or empty state ── */}
      {articles.length === 0 ? (
        <div style={{
          padding: '48px 32px',
          textAlign: 'center',
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 16,
        }}>
          <span style={{ fontSize: '2rem', display: 'block', marginBottom: 12 }}>⚽</span>
          <p style={{ fontSize: '0.95rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>
            World Cup coverage will appear here as stories are published.
          </p>
          <Link
            href={worldCup.href}
            style={{
              display: 'inline-block', marginTop: 16,
              fontSize: '0.82rem', fontWeight: 600,
              color: 'hsl(133 61% 45%)', textDecoration: 'none',
            }}
          >
            Visit the World Cup Special desk →
          </Link>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 24,
          }}>
            {articles.map(a => {
              const src = cleanImg(a.featuredImage)
              const mins = readingTime(a.body)
              const href = `/${a.category.slug}/${a.slug}`
              return (
                <Link
                  key={a.id}
                  href={href}
                  style={{ display: 'block', textDecoration: 'none', height: '100%' }}
                  className="card-lift"
                >
                  <article style={{
                    display: 'flex', flexDirection: 'column', height: '100%',
                    borderRadius: 16, overflow: 'hidden',
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(133 61% 14%)',
                  }}>
                    {/* Image */}
                    <div className="img-zoom" style={{
                      position: 'relative', aspectRatio: '16/9',
                      overflow: 'hidden', background: 'hsl(133 61% 6%)', flexShrink: 0,
                    }}>
                      {src ? (
                        <Image
                          src={src} alt={a.title} fill
                          sizes="(max-width: 768px) 100vw, 25vw"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '2.5rem',
                        }}>
                          ⚽
                        </div>
                      )}
                      {/* World Cup badge */}
                      <div style={{ position: 'absolute', top: 10, left: 10 }}>
                        <span style={{
                          fontSize: '0.52rem', fontWeight: 800,
                          textTransform: 'uppercase', letterSpacing: '0.1em',
                          background: 'hsl(133 61% 20% / 0.9)',
                          color: 'hsl(133 61% 60%)',
                          padding: '3px 8px', borderRadius: 4,
                          backdropFilter: 'blur(8px)',
                        }}>
                          World Cup
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                      <h3 style={{
                        fontFamily: 'var(--font-roboto)',
                        fontSize: '1rem', fontWeight: 900,
                        color: 'hsl(var(--card-foreground))', lineHeight: 1.35,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        flex: 1, margin: 0,
                      }}>
                        {a.title}
                      </h3>
                      {a.excerpt && (
                        <p style={{
                          fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))',
                          lineHeight: 1.5,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          margin: 0,
                        }}>
                          {a.excerpt}
                        </p>
                      )}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        fontSize: '0.68rem', color: 'hsl(var(--muted-foreground))',
                        paddingTop: 10, borderTop: '1px solid hsl(var(--border) / 0.5)',
                      }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                          {a.author?.name || 'Cameroon Concord'}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                          <Clock size={9} /> {mins} min
                          {a.publishedAt && (
                            <> · {formatDate(a.publishedAt)}</>
                          )}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>

          {/* Mobile "View all" link */}
          <div style={{ marginTop: 24, textAlign: 'center' }} className="md:hidden">
            <Link
              href={worldCup.href}
              style={{
                fontSize: '0.85rem', fontWeight: 700,
                color: 'hsl(133 61% 45%)', textDecoration: 'none',
              }}
            >
              View all World Cup coverage →
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
