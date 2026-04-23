# LESSONS — Cameroon Concord Rebuild
# Location: tasks/lessons.md
# Append new lessons below. Never delete old ones.

## 2026-04
- Always verify working directory before any file operation
- Never hardcode secrets in any file
- Always run npx tsc --noEmit before marking phase done
- Keep .env.local out of git at all times
- create-next-app@latest installs Tailwind v4 (CSS-based config, no tailwind.config.ts)
  — use globals.css @theme block instead of tailwind.config.ts for custom tokens
- drizzle-orm 0.45.x uses int('col', { unsigned: true }) NOT int('col').unsigned()
  — same for bigint: bigint('col', { mode: 'number', unsigned: true })
- Joomla backup (u470588398_ccbackup.sql) uses table prefix: news_
  — articles are in news_content (native Joomla, no K2 component)
- MySQL JSON columns return raw strings via mysql2/Drizzle spread — always use Array.isArray() guard
  or JSON.parse before .map()/.slice() on any JSON column. Never assume JSON columns are pre-parsed.
  Weak guard `!tags || tags.length === 0` does NOT catch non-empty strings — use Array.isArray(tags).
