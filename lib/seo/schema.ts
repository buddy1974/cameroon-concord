import {
  SITE_NAME, SITE_URL, SITE_LOGO,
  SITE_FB, SITE_TWITTER,
} from '@/lib/constants'
import type { ArticleWithRelations, Author } from '@/lib/types'
import { absoluteUrl, stripHtml } from '@/lib/utils'
import { safeJsonArray } from '@/lib/utils/safe-json'

const SITE_X = `https://twitter.com/${SITE_TWITTER.replace('@', '')}`
const SITE_TIKTOK = 'https://www.tiktok.com/@cameroonconcord'
const EDITORIAL_POLICY_URL = `${SITE_URL}/editorial-policy`
const CONTACT_URL = `${SITE_URL}/contact`
const ABOUT_URL = `${SITE_URL}/about`

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

function cleanImageUrl(url: string | null | undefined): string {
  const clean = url?.split('#')[0].trim()
  return clean && clean.startsWith('http') ? clean : `${SITE_URL}/icons/og-default.jpg`
}

function imageObject(url: string) {
  return {
    '@type': 'ImageObject',
    'url':   url,
    'width': 1200,
    'height': 675,
  }
}

function compactKeywords(values: string[]): string {
  return Array.from(new Set(values.map(v => v.trim()).filter(Boolean))).join(', ')
}

function wordCount(html: string): number {
  const text = stripHtml(html)
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

function authorSchema(author: ArticleWithRelations['author']): object {
  if (!author) {
    return {
      '@type': 'Organization',
      'name':  SITE_NAME,
      'url':   SITE_URL,
    }
  }

  const sameAs = author.twitter
    ? [`https://twitter.com/${author.twitter.replace('@', '')}`]
    : undefined

  return {
    '@type':  'Person',
    '@id':    `${SITE_URL}/author/${author.slug}#person`,
    'name':   author.name,
    'url':    `${SITE_URL}/author/${author.slug}`,
    ...(author.bio ? { 'description': author.bio } : {}),
    ...(author.avatarUrl ? { 'image': cleanImageUrl(author.avatarUrl) } : {}),
    ...(sameAs ? { 'sameAs': sameAs } : {}),
  }
}

export function buildNewsArticleSchema(article: ArticleWithRelations): object {
  const url = canonicalArticleUrl(article)
  const imageUrl = cleanImageUrl(article.featuredImage)
  const countryTags = safeJsonArray<string>(article.countryTags)
  const keywords = compactKeywords([
    article.category.name,
    ...countryTags,
    'Cameroon',
    'Cameroon news',
    'Southern Cameroons',
    'Africa news',
  ])

  return {
    '@context':           'https://schema.org',
    '@type':              'NewsArticle',
    '@id':                `${url}#newsarticle`,
    'headline':           article.title,
    'description':        article.excerpt || '',
    'url':                url,
    'datePublished':      isoDate(article.publishedAt),
    'dateModified':       isoDate(article.updatedAt || article.publishedAt),
    'articleSection':     article.category.name,
    'keywords':           keywords,
    'inLanguage':         'en',
    'isAccessibleForFree': true,
    'image':              [imageObject(imageUrl)],
    'thumbnailUrl':       imageUrl,
    'wordCount':          wordCount(article.body || ''),
    'author':             authorSchema(article.author),
    'publisher': {
      '@type': 'Organization',
      '@id':   `${SITE_URL}/#organization`,
      'name':  SITE_NAME,
      'url':   SITE_URL,
      'logo': {
        '@type':  'ImageObject',
        'url':    SITE_LOGO,
        'width':  214,
        'height': 50,
      },
      'sameAs': [SITE_FB, SITE_X, SITE_TIKTOK],
    },
    'isPartOf': {
      '@type': 'WebSite',
      '@id':   `${SITE_URL}/#website`,
    },
    'about': [
      { '@type': 'Thing', 'name': article.category.name },
      ...countryTags.map(name => ({ '@type': 'Place', 'name': name })),
    ],
    'copyrightHolder': {
      '@id': `${SITE_URL}/#organization`,
    },
    'copyrightYear': article.publishedAt ? new Date(article.publishedAt).getFullYear() : undefined,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id':   url,
    },
  }
}

export function buildOrganizationSchema(): object {
  return {
    '@context':    'https://schema.org',
    '@type':       'NewsMediaOrganization',
    '@id':         `${SITE_URL}/#organization`,
    'name':        SITE_NAME,
    'url':         SITE_URL,
    'logo':        {
      '@type': 'ImageObject',
      'url':   SITE_LOGO,
      'width': 214,
      'height': 50,
    },
    'sameAs':      [SITE_FB, SITE_X, SITE_TIKTOK],
    'foundingDate': '2014',
    'areaServed':  ['Cameroon', 'Southern Cameroons', 'Africa'],
    'knowsLanguage': ['en', 'fr'],
    'masthead': ABOUT_URL,
    'publishingPrinciples': EDITORIAL_POLICY_URL,
    'ethicsPolicy': EDITORIAL_POLICY_URL,
    'correctionsPolicy': EDITORIAL_POLICY_URL,
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'Newsroom',
      'email': 'editor@cameroon-concord.com',
      'url': CONTACT_URL,
    },
  }
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    'itemListElement': items.map((item, i) => ({
      '@type':    'ListItem',
      'position': i + 1,
      'name':     item.name,
      'item':     item.url,
    })),
  }
}

export function buildWebSiteSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type':    'WebSite',
    '@id':      `${SITE_URL}/#website`,
    'name':     SITE_NAME,
    'url':      SITE_URL,
    'publisher': {
      '@id': `${SITE_URL}/#organization`,
    },
    'potentialAction': {
      '@type':       'SearchAction',
      'target':      `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildAuthorSchema(author: Author, articleCount: number): object {
  const sameAs = author.twitter
    ? [`https://twitter.com/${author.twitter.replace('@', '')}`]
    : undefined

  return {
    '@context': 'https://schema.org',
    '@type':    'Person',
    '@id':      `${SITE_URL}/author/${author.slug}#person`,
    'name':     author.name,
    'url':      `${SITE_URL}/author/${author.slug}`,
    ...(author.bio ? { 'description': author.bio } : {}),
    ...(author.avatarUrl ? { 'image': cleanImageUrl(author.avatarUrl) } : {}),
    ...(sameAs ? { 'sameAs': sameAs } : {}),
    'worksFor': {
      '@id': `${SITE_URL}/#organization`,
    },
    'interactionStatistic': {
      '@type': 'InteractionCounter',
      'interactionType': 'https://schema.org/WriteAction',
      'userInteractionCount': articleCount,
    },
  }
}

export function buildProfilePageSchema(author: Author): object {
  return {
    '@context': 'https://schema.org',
    '@type':    'ProfilePage',
    '@id':      `${SITE_URL}/author/${author.slug}#profilepage`,
    'url':      `${SITE_URL}/author/${author.slug}`,
    'name':     `${author.name} - ${SITE_NAME}`,
    'about':    {
      '@id': `${SITE_URL}/author/${author.slug}#person`,
    },
    'isPartOf': {
      '@id': `${SITE_URL}/#website`,
    },
  }
}
