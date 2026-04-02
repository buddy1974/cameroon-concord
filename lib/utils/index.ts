import { READING_SPEED_WPM, SITE_URL } from '@/lib/constants'

export function readingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ')
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / READING_SPEED_WPM))
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', options ?? {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  })
}

export function formatDateline(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day:   'numeric',
    year:  'numeric',
  })
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now  = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60)     return 'Just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return formatDate(d)
}

export function articleUrl(categorySlug: string, articleSlug: string): string {
  return `/${categorySlug}/${articleSlug}`
}

export function categoryUrl(categorySlug: string): string {
  return `/${categorySlug}`
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.substring(0, length).trim() + '…'
}

export function slugToTitle(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function formatHitCount(hits: number): string {
  if (hits >= 1_000_000) return `${(hits / 1_000_000).toFixed(1)}M reads`
  if (hits >= 1_000)     return `${(hits / 1_000).toFixed(1)}K reads`
  return `${hits} reads`
}

export function buildMetaTitle(title: string, section?: string): string {
  const base = section ? `${title} | ${section}` : title
  return truncate(base, 60)
}

export function extractFirstImage(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match ? match[1] : null
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function depthScore(html: string): 'Quick Read' | 'Standard' | 'Deep Dive' | 'Analysis' {
  const words = stripHtml(html).split(/\s+/).length
  if (words < 200)  return 'Quick Read'
  if (words < 500)  return 'Standard'
  if (words < 1000) return 'Deep Dive'
  return 'Analysis'
}
