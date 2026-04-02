import type { Metadata } from 'next'
import {
  SITE_NAME, SITE_URL, SITE_DESCRIPTION,
  SITE_TWITTER, ADSENSE_ID,
} from '@/lib/constants'
import type { ArticleWithRelations, Category } from '@/lib/types'
import { absoluteUrl, truncate } from '@/lib/utils'

export function buildSiteMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default:  `${SITE_NAME} — Cameroon News`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
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
  const image       = article.featuredImage || `${SITE_URL}/icons/og-default.jpg`
  const url         = absoluteUrl(`/${article.category.slug}/${article.slug}`)

  return {
    title,
    description,
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
      publishedTime: article.publishedAt?.toString(),
      modifiedTime:  article.updatedAt?.toString(),
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
