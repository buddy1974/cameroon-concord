import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db/client'
import { articles, authors, categories, articleHits } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { ArticleCard } from '@/components/article/ArticleCard'
import { SITE_URL } from '@/lib/constants'
import type { ArticleWithRelations } from '@/lib/types'

export const revalidate = 3600

interface Props { params: Promise<{ slug: string }> }

function cleanImg(url: string | null | undefined): string | null {
  if (!url) return null
  const clean = url.split('#')[0].trim()
  if (!clean || !clean.startsWith('http')) return null
  return clean
}

async function getAuthor(slug: string) {
  const [author] = await db.select().from(authors).where(eq(authors.slug, slug)).limit(1)
  return author ?? null
}

async function getArticlesByAuthor(authorId: number): Promise<ArticleWithRelations[]> {
  const rows = await db
    .select({
      article:  articles,
      category: categories,
      author:   authors,
      hits:     articleHits.hits,
    })
    .from(articles)
    .innerJoin(categories,   eq(articles.categoryId, categories.id))
    .leftJoin(authors,       eq(articles.authorId,   authors.id))
    .leftJoin(articleHits,   eq(articleHits.articleId, articles.id))
    .where(and(eq(articles.authorId, authorId), eq(articles.status, 'published')))
    .orderBy(desc(articles.publishedAt))
    .limit(20)

  return rows.map(r => ({
    ...r.article,
    featuredImage: cleanImg(r.article.featuredImage),
    category: r.category,
    author:   r.author ?? null,
    tags:     [],
    hits:     r.hits ?? 0,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const author = await getAuthor(slug)
  if (!author) return {}
  return {
    title:       `${author.name} — Cameroon Concord`,
    description: author.bio ?? `Articles by ${author.name} on Cameroon Concord.`,
    alternates:  { canonical: `${SITE_URL}/author/${slug}` },
    openGraph: {
      title:       `${author.name} — Cameroon Concord`,
      description: author.bio ?? `Articles by ${author.name} on Cameroon Concord.`,
      url:         `${SITE_URL}/author/${slug}`,
      images:      author.avatarUrl ? [{ url: author.avatarUrl }] : [],
    },
  }
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params
  const author = await getAuthor(slug)
  if (!author) notFound()

  const authorArticles = await getArticlesByAuthor(author.id)

  return (
    <div style={{ paddingTop: '48px', paddingBottom: '64px' }}>

      {/* Author profile header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '48px', paddingBottom: '40px', borderBottom: '1px solid #1E1E1E' }}>
        {author.avatarUrl ? (
          <img
            src={author.avatarUrl}
            alt={author.name}
            width={80}
            height={80}
            style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #1E1E1E' }}
          />
        ) : (
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
            background: '#C8102E', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: '#fff',
          }}>
            {author.name.charAt(0)}
          </div>
        )}

        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
            {author.name}
          </h1>
          {author.bio && (
            <p style={{ fontSize: '0.9rem', color: '#9CA3AF', lineHeight: 1.7, maxWidth: '600px', margin: '0 0 12px' }}>
              {author.bio}
            </p>
          )}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {authorArticles.length} article{authorArticles.length !== 1 ? 's' : ''}
            </span>
            {author.twitter && (
              <a
                href={`https://twitter.com/${author.twitter.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.72rem', color: '#C8102E', textDecoration: 'none' }}
              >
                @{author.twitter.replace('@', '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Articles grid */}
      <h2 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F5A623', borderLeft: '3px solid #F5A623', paddingLeft: '10px', marginBottom: '24px' }}>
        Articles by {author.name}
      </h2>

      {authorArticles.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {authorArticles.map(a => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      ) : (
        <p style={{ color: '#555', fontSize: '0.9rem', padding: '40px 0' }}>No published articles yet.</p>
      )}
    </div>
  )
}
