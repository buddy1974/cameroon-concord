import { TwitterApi } from 'twitter-api-v2'
import { db } from '@/lib/db/client'
import { sql } from 'drizzle-orm'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cameroon-concord.com'

export interface SocialArticle {
  id:            number
  title:         string
  slug:          string
  excerpt?:      string | null
  featuredImage?: string | null
  category:      { slug: string; name: string }
}

async function postToFacebook(article: SocialArticle): Promise<void> {
  const pageId    = process.env.FB_PAGE_ID
  const pageToken = process.env.FB_PAGE_TOKEN || process.env.FB_ACCESS_TOKEN
  if (!pageId || !pageToken) throw new Error('FB credentials not set')

  const url     = `${SITE_URL}/${article.category.slug}/${article.slug}`
  const message = `${article.title}\n\n${article.excerpt ?? ''}\n\n${url}`

  const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ message, link: url, access_token: pageToken }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Facebook API ${res.status}: ${body}`)
  }

  await db.execute(sql`UPDATE articles SET fb_posted_at = NOW() WHERE id = ${article.id}`)
  console.log(`[social] FB posted — ${article.title.slice(0, 60)}`)
  console.log(`[social] FB success id=${article.id}`)
}

async function postToTwitter(article: SocialArticle): Promise<void> {
  const client = new TwitterApi({
    appKey:      process.env.TWITTER_API_KEY!,
    appSecret:   process.env.TWITTER_API_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_SECRET!,
  })

  const url  = `${SITE_URL}/${article.category.slug}/${article.slug}`
  const max  = 280 - 24
  const text = article.title.length <= max
    ? `${article.title} ${url}`
    : `${article.title.slice(0, max - 1)}… ${url}`

  await client.v2.tweet(text)
  await db.execute(sql`UPDATE articles SET twitter_posted_at = NOW() WHERE id = ${article.id}`)
  console.log(`[social] Twitter posted — ${article.title.slice(0, 60)}`)
  console.log(`[social] Twitter success id=${article.id}`)
}

async function postToTelegram(article: SocialArticle): Promise<void> {
  const botToken  = process.env.TELEGRAM_BOT_TOKEN
  const channelId = process.env.TELEGRAM_CHANNEL_ID
  if (!botToken || !channelId) throw new Error('Telegram credentials not set')

  const url  = `${SITE_URL}/${article.category.slug}/${article.slug}`
  const text = `*${article.title}*\n\n${article.excerpt || ''}\n\n[Read more](${url})`

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      chat_id:                channelId,
      text,
      parse_mode:             'Markdown',
      disable_web_page_preview: false,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Telegram API error: ${JSON.stringify(err)}`)
  }
  console.log(`[social] Telegram success id=${article.id}`)
}

export async function postArticleToSocial(article: SocialArticle): Promise<void> {
  await Promise.allSettled([
    postToFacebook(article).catch(err =>
      console.error(`[social] FB error id=${article.id}:`, err)
    ),
    postToTwitter(article).catch(err =>
      console.error(`[social] Twitter error id=${article.id}:`, err)
    ),
    postToTelegram(article)
      .then(() => console.log(`[social] Telegram success id=${article.id}`))
      .catch(e => console.error(`[social] Telegram error id=${article.id}:`, e.message)),
  ])
}
