# Newsroom API v1 — Cameroon Concord implementation

This site implements the publication side of the TM (Telegram Mobile Newsroom)
contract. **The contract is authoritative**:
`newsroom-control-plane/docs/newsroom-api-v1.md` (repository `newsroom-control-plane`).
This page only records what is specific to Cameroon Concord (CC).

TM never touches this database. Every editorial read/write from TM goes through
`/api/newsroom/v1/*`, signed with HMAC-SHA256 (contract §2). Cameroon Concord stays
the authority for content, permissions, audit and media.

## Code map

| Path | Purpose |
|---|---|
| `app/api/newsroom/v1/**/route.ts` | Thin route files (health, me, categories, authors, articles, publish/unpublish/schedule/unschedule, media, presign, confirm, scheduler/run, cron/publish-scheduled) |
| `lib/newsroom/handler.ts` | Route wrapper: enabled → raw body → signature/timestamp/nonce → actor grant + role → writes-enabled → idempotency → handler → audit → envelope |
| `lib/newsroom/verify.ts` | Header parsing, canonical string, HMAC, ±300 s window, nonce consumption |
| `lib/newsroom/permissions.ts` | Role matrix (contract §4), owner bootstrap |
| `lib/newsroom/articles.ts` | Article mapping, `version`, create/update/publish/unpublish/schedule/unschedule, `publishDue` |
| `lib/newsroom/media.ts`, `media-r2.ts` | Base64 upload, presign, confirm; R2 storage |
| `lib/newsroom/idempotency.ts`, `audit.ts`, `http.ts`, `config.ts` | Supporting modules |
| `lib/newsroom/store.ts`, `store-mysql.ts` | Persistence interface + MySQL implementation (loaded lazily) |
| `lib/db/schema/newsroom.ts`, `lib/db/migrations/newsroom/0001_newsroom.sql` | Newsroom tables (additive; `articles` is unchanged) |
| `tests/newsroom/*` | Tests (in-memory store, fake storage, TM reference signer) |

## Environment variables

| Variable | Notes |
|---|---|
| `NEWSROOM_API_ENABLED` | `true` to enable. Otherwise every endpoint answers `503 API_DISABLED` (health still answers 200 with `enabled:false`). |
| `NEWSROOM_WRITES_ENABLED` | Optional. `false` → writes `503 WRITES_DISABLED`, reads keep working. |
| `NEWSROOM_SIGNING_SECRET` | Shared with TM; unique to CC. If missing — **or equal to `AUTOMATION_API_KEY`** — the API answers `503 API_NOT_CONFIGURED`. Generate with `openssl rand -base64 32`. |
| `NEWSROOM_OWNER_TELEGRAM_IDS` | Optional, comma-separated numeric IDs treated as active `publisher`. |
| `CRON_SECRET` | Protects the cron route. Unset → the cron route answers `503`. |

Media uses the existing `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
`R2_BUCKET`, `R2_PUBLIC_URL`. Without them, media endpoints answer `503 API_NOT_CONFIGURED`.
Public article URLs use `SITE_URL` (`NEXT_PUBLIC_SITE_URL`).

## Database setup (run by the owner, not by CI)

```bash
npm run newsroom:migrate -- --dry-run   # print the SQL, touch nothing
npm run newsroom:migrate                # CREATE TABLE IF NOT EXISTS × 5 (uses .env.local DB_*)
npm run newsroom:grant -- <telegramId> <viewer|contributor|editor|publisher> [displayName]
npm run newsroom:grant -- <telegramId> revoke
```

Tables: `newsroom_grants`, `newsroom_nonces`, `newsroom_idempotency`, `newsroom_audit`,
`newsroom_article_origins`. The migration script refuses any statement that is not
`CREATE TABLE IF NOT EXISTS`. Both scripts print table names/status only, never credentials.
Nonces (15 min TTL) and idempotency rows (kept 8 days) are pruned opportunistically by the API.

## Status mapping (CC)

CC's `articles.status` enum is `draft | scheduled | published | archived` — there is no
`unpublished`. Therefore:

| Operation | Allowed from | Result | `published_at` |
|---|---|---|---|
| publish | `draft`, `scheduled` | `published` | set to now (only on this transition) |
| unpublish | `published` | **`draft`** | kept |
| schedule (`scheduledAt` ≥ now + 60 s) | `draft` | `scheduled` | unchanged |
| unschedule | `scheduled` | `draft` (`scheduled_at` cleared) | unchanged |
| scheduler/cron | `scheduled` and `scheduled_at` ≤ now | `published` | = `scheduled_at` |

Anything else → `409 INVALID_STATE`. Re-scheduling a scheduled article requires unschedule first.
`archived` articles cannot be changed by publish/schedule transitions.

Publishing through this API **only** updates the row and revalidates caches
(`revalidateTag('articles', {})` plus `/`, the category, the article, sitemaps and RSS) —
it never calls `postArticleToSocial`, IndexNow, the Facebook scrape, push or the score hook.

## Articles

- **Create** (`POST /articles`): always `draft`; unknown input fields (e.g. `status`, `slug`) are
  ignored and never written. Slug = `slugify(title)` (≤ 200 chars), `-2`, `-3`, … on collision; never
  changes afterwards via this API. Body is sanitised with `sanitizeArticleBody`. `categoryId` or
  `categorySlug` is required and must exist — **no fallback to category 9** (unlike the CMS route).
  `aiAssisted: true` → `ai_generated = 1`, `ai_reviewed = 0`. The creating Telegram user is recorded in
  `newsroom_article_origins` (drives the contributor "own draft" rule and `createdViaNewsroom`).
- **Update** (`PATCH /articles/:id`): strict allowlist; any other field → `422 VALIDATION`.
  `expectedVersion` required; the write is also guarded on `(status, updated_at)` so a concurrent CMS
  edit yields `409 VERSION_CONFLICT`. Edits to a published article revalidate its pages.
- **List**: `status` accepts CC statuses only (others → 422); an unknown `category` returns `[]`;
  `since`/`until` filter on `updated_at`; ordered by `updated_at` desc.

## Categories and authors

`GET /categories` and `GET /authors` return `{ id, slug, name }` straight from the `categories` and
`authors` tables (author emails/API keys are never exposed).

## Media

- `POST /media`: base64, ≤ 4 MB decoded. JPEG/PNG/WebP/GIF images → WebP (≤ 1200 px, q82, EXIF-rotated)
  like the CMS upload. PDF, MP4, QuickTime, OGG and MPEG audio are stored as-is after a magic-byte check.
  Key `newsroom/<uuid>.<ext>`, row in `media` (with `article_id`). `role` defaults to `attachment`.
  `role=featured` requires `articleId` + `expectedVersion` (checked before upload) and sets
  `featured_image`, plus `image_alt`/`image_caption` when given. `media` has no caption column, so a
  caption is only stored on the article for featured images.
- **Vercel body limit:** serverless requests are capped at ~4.5 MB, so base64 direct uploads are
  effectively limited to ~3.3 MB decoded in production. TM should use presign for anything larger.
- `POST /media/presign`: PUT URL valid 15 min, up to 100 MB; the client must send the returned
  `Content-Type` header. Presigned files are stored as uploaded (no WebP conversion).
- `POST /media/confirm`: verifies the object via `HeadObject` (type must match the key extension),
  records it once (a second confirm → `409 INVALID_STATE`); width/height are `null`.
- Size problems answer `422 VALIDATION` (the contract has no 413).

## Scheduling and cron

- TM drives the frequent cadence via `POST /scheduler/run` (actor `system:scheduler` or a publisher).
- `vercel.json` adds one **daily** Vercel Cron backstop (`0 5 * * *`, Hobby-safe) on
  `GET /api/newsroom/v1/cron/publish-scheduled`, authenticated with `Authorization: Bearer $CRON_SECRET`
  (timing-safe). Audited as actor `system:cron`, operation `scheduler.cron`.
- Concurrent runs cannot double-publish: each row is updated with a `(status, updated_at)` guard.
- Note: the scheduler publishes **any** `scheduled` article with a non-null `scheduled_at` in the past.
  The CMS never sets `scheduled_at`, so only newsroom-scheduled rows qualify in practice. Before the
  first enable, check read-only:
  `SELECT id, title, scheduled_at FROM articles WHERE status='scheduled' AND scheduled_at IS NOT NULL;`

## Audit

Writes (ok / denied / error) are appended to `newsroom_audit` with field **names** only. Reads are
not audited. Requests rejected at signature/timestamp/nonce level (401) are not audited — the actor
is unverified and verification deliberately happens before any database access.

## Idempotency

`POST`/`PATCH` require `x-newsroom-idempotency-key`. The key is reserved before the write; a
concurrent duplicate gets `409 IDEMPOTENCY_MISMATCH` ("still in progress"). Only successful responses
are stored for replay (a replayed `201` answers `200`); a failed request releases its key so the
client can retry with a corrected body. Reservations older than 2 minutes are treated as abandoned.

## Deviations / clarifications vs the contract

1. No `unpublished` status in CC → unpublish returns to `draft` (as the contract allows for CC).
2. `NEWSROOM_SIGNING_SECRET` equal to `AUTOMATION_API_KEY` is treated as not configured.
3. 401 failures are not audited (see Audit).
4. `POST /articles` ignores unknown fields; `PATCH` rejects them (422).
5. GIF accepted as an image type; presign max 100 MB; size violations → 422.
6. Request bodies over 6 MB → `400 BAD_REQUEST`.
7. Health always answers 200 (flags in the body), so TM can read `enabled`/`configured`.
