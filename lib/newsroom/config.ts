/**
 * Newsroom API configuration. Read lazily from the environment on every call
 * so toggling a Vercel env var (or a test) takes effect without module reloads.
 */
export const PUBLICATION_KEY = 'cameroon-concord'

export interface NewsroomConfig {
  enabled: boolean
  writesEnabled: boolean
  /** null when unset, or when it (insecurely) equals AUTOMATION_API_KEY. */
  secret: string | null
  ownerTelegramIds: Set<string>
  cronSecret: string | null
  publication: string
}

export function getNewsroomConfig(): NewsroomConfig {
  const rawSecret = process.env.NEWSROOM_SIGNING_SECRET?.trim() || ''
  const automationKey = process.env.AUTOMATION_API_KEY || ''
  // The contract forbids reusing AUTOMATION_API_KEY — treat that as not configured.
  const secret = rawSecret && rawSecret !== automationKey ? rawSecret : null
  const ownerTelegramIds = new Set(
    (process.env.NEWSROOM_OWNER_TELEGRAM_IDS || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => /^\d{1,20}$/.test(s)),
  )
  return {
    enabled: process.env.NEWSROOM_API_ENABLED === 'true',
    writesEnabled: process.env.NEWSROOM_WRITES_ENABLED !== 'false',
    secret,
    ownerTelegramIds,
    cronSecret: process.env.CRON_SECRET?.trim() || null,
    publication: PUBLICATION_KEY,
  }
}
