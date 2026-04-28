import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/maintenance',
        ],
      },
      {
        userAgent: 'Googlebot-News',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
        ],
      },
    ],
    sitemap: [
      'https://www.cameroon-concord.com/sitemap.xml',
      'https://www.cameroon-concord.com/api/news-sitemap',
    ],
  }
}
