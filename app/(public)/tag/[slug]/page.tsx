import { searchArticles } from '@/lib/db/queries'
import { ArticleCard } from '@/components/article/ArticleCard'
import { notFound } from 'next/navigation'

export const revalidate = 3600

function toTitle(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!slug) notFound()

  const term    = slug.replace(/-/g, ' ')
  const heading = toTitle(slug)
  const results = await searchArticles(term, 24)

  return (
    <div style={{ paddingTop: '32px', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
          {heading}
        </h1>
        <p style={{ fontSize: '0.78rem', color: '#444', marginTop: '6px' }}>
          {results.length} article{results.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {results.length === 0 ? (
        <p style={{ color: '#555', fontSize: '0.9rem' }}>No articles found for this topic.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {results.map(article => (
            <ArticleCard key={article.id} article={article} variant="default" />
          ))}
        </div>
      )}
    </div>
  )
}
