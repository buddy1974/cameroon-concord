export const SITE_NAME    = 'Cameroon Concord'
export const SITE_URL     = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cameroon-concord.com'
export const SITE_TAGLINE = 'In the Heart of Cameroon\'s News Pulse'
export const SITE_DESCRIPTION = 'Get timely updates on Cameroon\'s current affairs. Breaking news, analysis, and insights covering Cameroon and Southern Cameroons.'
export const SITE_TWITTER  = '@CameroonC'
export const SITE_FB       = 'https://www.facebook.com/cameroonconcord'
export const SITE_LOGO     = `${SITE_URL}/icons/logo.png`
export const ADSENSE_ID    = 'ca-pub-0554291063972402'

export const CATEGORIES = [
  { slug: 'headlines',          name: 'Headlines',    color: '#C8102E' },
  { slug: 'politics',           name: 'Politics',     color: '#C8102E' },
  { slug: 'society',            name: 'Society',      color: '#007A3D' },
  { slug: 'southern-cameroons', name: 'S. Cameroons', color: '#F5A623' },
  { slug: 'health',             name: 'Health',       color: '#007A3D' },
  { slug: 'business',           name: 'Business',     color: '#F5A623' },
  { slug: 'sportsnews',         name: 'Sports',       color: '#C8102E' },
  { slug: 'lifestyle',          name: 'Lifestyle',    color: '#007A3D' },
  { slug: 'editorial',          name: 'Editorial',    color: '#C8102E' },
  { slug: 'inside-cpdm',        name: 'Biya',         color: '#8B0000' },
  { slug: 'society',            name: 'Local News',   color: '#007A3D' },
] as const

export const NAV_CATEGORIES = CATEGORIES.slice(0, 8)

export const ARTICLES_PER_PAGE   = 20
export const BREAKING_NEWS_COUNT = 5
export const FEATURED_COUNT      = 3
export const RELATED_COUNT       = 4

export const READING_SPEED_WPM = 200
