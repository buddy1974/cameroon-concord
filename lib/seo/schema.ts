import {
  SITE_NAME, SITE_URL, SITE_LOGO,
  SITE_FB, SITE_TWITTER,
} from '@/lib/constants'
import type { ArticleWithRelations } from '@/lib/types'
import { absoluteUrl } from '@/lib/utils'

export function buildNewsArticleSchema(article: ArticleWithRelations): object {
  const url   = absoluteUrl(`/${article.category.slug}/${article.slug}`)
  const image = article.featuredImage || `${SITE_URL}/icons/og-default.jpg`

  return {
    '@context':       'https://schema.org',
    '@type':          'NewsArticle',
    'headline':       article.title,
    'description':    article.excerpt || '',
    'url':            url,
    'datePublished':  article.publishedAt,
    'dateModified':   article.updatedAt || article.publishedAt,
    'articleSection': article.category.name,
    'keywords':       `${article.category.name}, Cameroon, Africa, news`,
    'inLanguage':     'en',
    'image': [image],
    'author': {
      '@type': 'Organization',
      'name':  SITE_NAME,
    },
    'publisher': {
      '@type': 'Organization',
      'name':  SITE_NAME,
      'url':   SITE_URL,
      'logo': {
        '@type':  'ImageObject',
        'url':    SITE_LOGO,
        'width':  214,
        'height': 50,
      },
      'sameAs': [SITE_FB, `https://twitter.com/${SITE_TWITTER.replace('@', '')}`],
    },
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
    'name':        SITE_NAME,
    'url':         SITE_URL,
    'logo':        SITE_LOGO,
    'sameAs':      [SITE_FB, `https://twitter.com/${SITE_TWITTER.replace('@', '')}`],
    'foundingDate': '2014',
    'areaServed':  ['Cameroon', 'Southern Cameroons', 'Africa'],
    'knowsLanguage': ['en', 'fr'],
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
    'name':     SITE_NAME,
    'url':      SITE_URL,
    'potentialAction': {
      '@type':       'SearchAction',
      'target':      `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}
