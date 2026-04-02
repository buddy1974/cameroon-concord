# Cameroon Concord — Social Automation

## Overview

This system ingests news from Google News RSS, Cameroon news sites, and a Telegram channel. It processes content through Claude AI and auto-posts to Facebook and Twitter/X on a managed schedule.

## Workflow Map

Four n8n workflows run in sequence. Each is independent but feeds the next via the shared Neon database.

| # | File | Trigger | What It Does |
|---|------|---------|--------------|
| 1 | `workflow-news-ingestion.json` | Every 30 min | Crawls Google News RSS + Cameroon sites. Deduplicates by content hash. Inserts rows to `ingested_content` with `status = pending`. |
| 2 | `workflow-telegram-poller.json` | Every 5 min | Reads configured Telegram channel via Bot API. Extracts text and images. Inserts to `ingested_content` with `status = pending`. |
| 3 | `workflow-content-publishing.json` | Every 15 min | Reads `ingested_content` where `status = queued`. Calls Claude to generate captions. Posts to Facebook and Twitter/X. Marks rows `published`. |
| 4 | `workflow-comment-engagement.json` | Every 2 hours | Fetches new Facebook comments on published posts. Calls Claude to generate replies. Posts replies via Facebook Graph API. |

## Credentials Required

Configure all credentials in n8n before activating any workflow.

- [ ] **Neon DB connection string** → n8n Postgres credential named `Concord Neon DB`
- [ ] **Anthropic API key** → n8n HTTP Header Auth credential or environment variable
- [ ] **Facebook Page Access Token** (long-lived) → n8n HTTP Header Auth credential named `Concord FB Token`
- [ ] **Facebook Page ID** → hardcoded in the publishing workflow Code node
- [ ] **Twitter/X Bearer Token + OAuth1 keys** → n8n Twitter credential named `Concord Twitter`
- [ ] **Telegram Bot Token** → n8n Telegram credential named `Concord Telegram Bot`

To generate a long-lived Facebook Page Access Token: use the Graph API Explorer, exchange the short-lived user token, then exchange for a page token. Long-lived tokens last ~60 days — set a calendar reminder to rotate.

## Database Setup

**Step 1:** Create a new Neon project named `cameroon-concord-social`.

**Step 2:** Open the Neon SQL editor, paste the contents of `database/neon-schema.sql`, and run it. All four tables, indexes, and the `updated_at` trigger will be created.

Verify by running:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```
Expected output: `ingested_content`, `social_posts`, `social_comments`, `social_rotation`.

## Posting Schedule

The publishing workflow respects scheduled slots set in `social_posts.scheduled_at`. Default rotation:

| Time (UTC+1 WAT) | Platforms | Priority |
|------------------|-----------|----------|
| 06:00 | Facebook + Twitter | Breaking first, then Politics |
| 09:00 | Facebook + Twitter | Sports + Business |
| 12:00 | Facebook + Twitter | Breaking first, then Health |
| 15:00 | Facebook | Politics + Southern Cameroons |
| 18:00 | Facebook + Twitter | Sports results + Business |
| 21:00 | Twitter | Category rotation — whatever has queued items |

Adjust slots in the publishing workflow Schedule Trigger node. Category rotation is controlled via `social_rotation.daily_limit`.

## Platform Limits

| Platform | Limit | Notes |
|----------|-------|-------|
| Twitter/X free tier | 17 posts / 24 hrs per app | Hard cap. Recommendation: set `daily_limit = 10` in `social_rotation` to leave a 7-post buffer for retries and manual posts. |
| Facebook Pages API | 200 requests / hr | Not a practical constraint. |

If Twitter posts begin failing with HTTP 429, the daily cap has been hit. The workflow will mark those rows `failed` with `error_message = 'rate_limited'`. They will retry the next day if `retry_count < 3`.

## Adding a New Source

**Step 1:** Open `workflow-news-ingestion.json` in n8n. Add the new RSS URL or HTTP Request scrape config as a new branch in the ingestion section.

**Step 2:** In the Code node that maps sources, add the new `source_name` string (e.g. `'cameroon_tribune'`) to the source map object.

**Step 3:** Run the workflow manually once using the n8n Test Workflow button. Verify a row appears in `ingested_content` with the correct `source_name`. Only enable the live schedule after a clean test run.
