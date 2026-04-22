import { db } from '@/lib/db/client'
import { articles, categories } from '@/lib/db/schema'
import { eq, and, desc, or, like } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/constants'
import { ArticleCard } from '@/components/article/ArticleCard'
import type { ArticleWithRelations } from '@/lib/types'
import type { Metadata } from 'next'

const HUBS = {
  'anglophone-crisis': {
    title: 'Anglophone Crisis — Full Coverage',
    headline: 'The Anglophone Crisis: Everything You Need to Know',
    description: "Comprehensive coverage of Cameroon's Anglophone crisis — the armed conflict in the Northwest and Southwest regions, peace talks, civilian casualties, and the fight for Ambazonian independence.",
    keywords: ['anglophone', 'ambazonia', 'southern cameroons', 'northwest', 'southwest', 'bir', 'separatist'],
    intro: "Since 2016, Cameroon's English-speaking regions have been engulfed in an armed conflict that has killed thousands, displaced over 700,000 people, and drawn international condemnation. Cameroon Concord has covered every development — from the first lawyers' strike to the latest military operations. This is the complete record.",
  },
  'paul-biya': {
    title: 'Paul Biya — News & Analysis',
    headline: "Paul Biya: Cameroon's 43-Year President",
    description: 'All Cameroon Concord coverage of President Paul Biya — his health, political decisions, family, the CPDM party-state, and the looming succession crisis.',
    keywords: ['biya', 'paul biya', 'cpdm', 'presidency', 'succession', 'chantal biya'],
    intro: 'Paul Biya has ruled Cameroon since 1982 — longer than most of his citizens have been alive. At 91, he remains the subject of constant speculation about his health, his successors, and what comes after 43 years of one-man rule. CC tracks every development.',
  },
  'samuel-etoo-fecafoot': {
    title: "Samuel Eto'o & FECAFOOT — Full Coverage",
    headline: "Samuel Eto'o and the FECAFOOT Scandal",
    description: "Complete Cameroon Concord coverage of Samuel Eto'o's FECAFOOT presidency — corruption allegations, FIFA investigations, governance failures, and Cameroon football's crisis.",
    keywords: ["etoo", "eto'o", 'fecafoot', 'football', 'corruption', 'indomitable lions'],
    intro: "Samuel Eto'o's election as FECAFOOT president in 2021 promised to transform Cameroonian football. Instead it has been marked by financial scandal, governance breakdown, and FIFA scrutiny. CC has documented every twist.",
  },
  'cameroon-elections-2025': {
    title: 'Cameroon Elections 2025 — Full Coverage',
    headline: "Cameroon's 2025 Presidential Election: The Full Story",
    description: "Complete coverage of Cameroon's disputed 2025 presidential election — Biya's declared victory, Tchiroma's challenge, post-election protests, and the ongoing political crisis.",
    keywords: ['election', '2025', 'tchiroma', 'vote', 'presidential', 'protest', 'ghost town'],
    intro: "October 2025 saw Cameroon's most contested presidential election in decades. While official results declared Paul Biya the winner, opposition candidate Issa Tchiroma and international observers challenged the outcome. The crisis that followed shook the country's political foundations.",
  },
  'cameroon-diaspora': {
    title: 'Cameroon Diaspora News',
    headline: 'Cameroon Diaspora: News From the Community Abroad',
    description: 'News, stories and analysis about Cameroonians living abroad — in Germany, UK, USA, Canada, France and beyond. Community news, immigration, diaspora activism and more.',
    keywords: ['diaspora', 'germany', 'uk', 'united kingdom', 'usa', 'canada', 'abroad', 'immigration'],
    intro: 'Over 4 million Cameroonians live outside Cameroon. Their stories — of success, struggle, activism, and connection to home — are as much part of the Cameroonian story as anything happening in Yaoundé. CC covers the diaspora as a full part of the national story.',
  },
}

type HubSlug = keyof typeof HUBS

export const revalidate = 3600

export async function generateStaticParams() {
  return Object.keys(HUBS).map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const hub = HUBS[slug as HubSlug]
  if (!hub) return {}
  return {
    title: `${hub.title} | Cameroon Concord`,
    description: hub.description,
    alternates: { canonical: `${SITE_URL}/topics/${slug}` },
  }
}

export default async function TopicHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const hub = HUBS[slug as HubSlug]
  if (!hub) notFound()

  const conditions = hub.keywords.map(kw => like(articles.title, `%${kw}%`))

  type HubArticle = {
    id: number; title: string; slug: string; body: string
    excerpt: string | null; featuredImage: string | null; publishedAt: Date | null
    isBreaking: boolean | null; isFeatured: boolean | null
    category: { name: string; slug: string }
  }
  let hubArticles: HubArticle[] = []
  try {
    hubArticles = await db
      .select({
        id:            articles.id,
        title:         articles.title,
        slug:          articles.slug,
        body:          articles.body,
        excerpt:       articles.excerpt,
        featuredImage: articles.featuredImage,
        publishedAt:   articles.publishedAt,
        isBreaking:    articles.isBreaking,
        isFeatured:    articles.isFeatured,
        category:      { name: categories.name, slug: categories.slug },
      })
      .from(articles)
      .innerJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(eq(articles.status, 'published'), or(...conditions)))
      .orderBy(desc(articles.publishedAt))
      .limit(48)
  } catch {
    // DB unavailable at render time
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#C8102E', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
        CC Topic Coverage
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#F0F0F0', marginBottom: '16px', lineHeight: 1.2 }}>
        {hub.headline}
      </h1>
      <p style={{ fontSize: '0.95rem', color: '#888', lineHeight: 1.7, marginBottom: '32px', maxWidth: '700px' }}>
        {hub.intro}
      </p>
      <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: '24px' }}>
        {hubArticles.length} articles — updated continuously
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {hubArticles.map(a => (
          <ArticleCard key={a.id} article={a as unknown as ArticleWithRelations} />
        ))}
      </div>
      {hubArticles.length === 0 && (
        <p style={{ color: '#555', textAlign: 'center', padding: '40px' }}>No articles found for this topic yet.</p>
      )}
    </div>
  )
}
