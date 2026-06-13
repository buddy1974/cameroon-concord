import type { Metadata } from 'next'
import {
  SITE_NAME, SITE_URL, SITE_DESCRIPTION,
  SITE_TWITTER, ADSENSE_ID,
} from '@/lib/constants'
import type { ArticleWithRelations, Category } from '@/lib/types'
import { absoluteUrl, truncate } from '@/lib/utils'

function canonicalArticleUrl(article: ArticleWithRelations): string {
  const override = article.canonicalUrl?.trim()
  if (!override) return absoluteUrl(`/${article.category.slug}/${article.slug}`)
  return override.startsWith('http') ? override : absoluteUrl(override.startsWith('/') ? override : `/${override}`)
}

function isoDate(date: Date | string | null | undefined): string | undefined {
  if (!date) return undefined
  const parsed = typeof date === 'string' ? new Date(date) : date
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}

export function buildSiteMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default:  `${SITE_NAME} — Independent Cameroon News`,
      template: `%s | ${SITE_NAME}`,
    },
    description: 'Independent English-language news covering Cameroon and Southern Cameroons since 2014. Politics, society, sports, business and more.',
    openGraph: {
      type:        'website',
      siteName:    SITE_NAME,
      locale:      'en_US',
      url:         SITE_URL,
      title:       `${SITE_NAME} — Cameroon News`,
      description: SITE_DESCRIPTION,
      images: [{
        url:    `${SITE_URL}/icons/og-default.jpg`,
        width:  1200,
        height: 630,
        alt:    SITE_NAME,
      }],
    },
    twitter: {
      card:    'summary_large_image',
      site:    SITE_TWITTER,
      creator: SITE_TWITTER,
    },
    robots: {
      index:  true,
      follow: true,
      googleBot: {
        index:               true,
        follow:              true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet':       -1,
      },
    },
    alternates: {
      canonical: SITE_URL,
      types: {
        'application/rss+xml': `${SITE_URL}/rss.xml`,
      },
    },
    verification: {
      google: process.env.GOOGLE_VERIFICATION ?? '',
    },
    other: {
      'google-adsense-account': ADSENSE_ID,
    },
  }
}

export function buildArticleMetadata(article: ArticleWithRelations): Metadata {
  const title       = article.metaTitle  || truncate(article.title, 60)
  const description = article.metaDesc   || article.excerpt || SITE_DESCRIPTION
  // Strip URL fragments (#...) — Facebook's scraper rejects fragment URLs as og:image
  const rawImage    = article.featuredImage?.split('#')[0].trim()
  const image       = rawImage || `${SITE_URL}/icons/og-default.jpg`
  const url         = canonicalArticleUrl(article)

  return {
    title,
    description,
    authors: article.author
      ? [{ name: article.author.name, url: `${SITE_URL}/author/${article.author.slug}` }]
      : [{ name: SITE_NAME, url: SITE_URL }],
    publisher: SITE_NAME,
    keywords: [
      article.category.name,
      'Cameroon',
      'Cameroon news',
      'Southern Cameroons',
      'Africa news',
    ].join(', '),
    openGraph: {
      type:          'article',
      url,
      title,
      description,
      siteName:      SITE_NAME,
      locale:        'en_US',
      publishedTime: isoDate(article.publishedAt),
      modifiedTime:  isoDate(article.updatedAt || article.publishedAt),
      section:       article.category.name,
      images: [{
        url:    image,
        width:  1200,
        height: 630,
        alt:    article.title,
      }],
    },
    twitter: {
      card:        'summary_large_image',
      site:        SITE_TWITTER,
      title,
      description,
      images:      [image],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index:  true,
      follow: true,
      googleBot: {
        index:               true,
        follow:              true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet':       -1,
      },
    },
  }
}

export function buildCategoryMetadata(category: Category): Metadata {
  const title = `${category.name} News — Latest Updates | ${SITE_NAME}`
  const description = category.metaDesc
    || `Latest ${category.name} news from Cameroon and Southern Cameroons. Breaking updates, analysis and reports.`

  return {
    title,
    description,
    openGraph: {
      type:        'website',
      title,
      description,
      siteName:    SITE_NAME,
      url:         absoluteUrl(`/${category.slug}`),
      images: [{
        url:    `${SITE_URL}/icons/og-default.jpg`,
        width:  1200,
        height: 630,
        alt:    `${category.name} — ${SITE_NAME}`,
      }],
    },
    twitter: {
      card:        'summary_large_image',
      site:        SITE_TWITTER,
      title,
      description,
    },
    alternates: {
      canonical: absoluteUrl(`/${category.slug}`),
    },
  }
}
