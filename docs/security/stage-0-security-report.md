# Stage 0 Security Remediation — Cameroon Concord

| | |
|---|---|
| Date | 2026-10-06 |
| Branch | `stage-0/security-remediation` (from `main` @ `dd837ec`) — **not merged, not pushed, not deployed** |
| Scope | Remediation only. No editorial behaviour change, no Telegram work, no `/api/newsroom/v1`, no new tables. |
| Approval | Owner approval required before merge / deploy. |

No secret values appear in this document.

## 1. Vulnerabilities fixed

| # | Vulnerability | Affected | Remediation | Verified by |
|---|---|---|---|---|
| 1 | **Unauthenticated article read/edit/publish/delete** | `GET/PUT/DELETE /api/admin/articles/[id]` | `requireAdmin(req)` on all three methods | `routes.test.ts` (no session / forged token → 401; machine key → 401) |
| 2 | Unauthenticated admin writes | `POST /api/admin/accountability`, `PATCH/DELETE /api/admin/accountability/[id]`, `PATCH/DELETE /api/admin/exile-voices/[id]`, `POST /api/admin/live-updates`, `DELETE /api/admin/live-updates/[id]` | `requireAdmin(req)` | `routes.test.ts` (7 cases → 401) |
| 3 | **Non-awaited `verifyToken()`** — any non-empty `admin_token` cookie passed (bug class, 7 sites) | `admin/comments` (GET), `comments/[id]` (PUT), `comments/ban`, `comments/reply`, `newsletter/send` (mass e-mail), `newsletter/subscribers`, `newsletter/articles` | Converted to the shared, awaited `requireAdmin(req)` | `routes.test.ts` (junk cookie → 401) + static scan: no un-awaited `verifyToken(` anywhere in `app/ lib/ components/` |
| 4 | Server credential read from a `NEXT_PUBLIC_` variable (would ship in the browser bundle) | `n8n/openai`, `n8n/social`, `push/send`, `admin/articles/[id]` (server-to-server push call), `QuickPublish` client header | Machine auth now uses server-only `AUTOMATION_API_KEY`; client header removed (QuickPublish already fell back to the session cookie) | `auth.test.ts`, `routes.test.ts` (NEXT_PUBLIC value → 401), static scan |
| 5 | Non-timing-safe key / password comparison | `requireAutomation`, login, maintenance login | `safeEqual()` — SHA-256 + `crypto.timingSafeEqual` | `auth.test.ts` |
| 6 | Hard-coded auth fallbacks | `JWT_SECRET` fallback literal, `ADMIN_PASSWORD` fallback, `MAINTENANCE_PASSWORD` fallback, proxy bypass when password unset (`undefined === undefined`) | Removed. Missing secret ⇒ login 503 / token verification denies / maintenance bypass impossible. The retired JWT fallback value is explicitly rejected. | `auth.test.ts`, `routes.test.ts`, static scan |
| 7 | Article PUT wrote **any** column from JSON | `PUT /api/admin/articles/[id]` | `lib/articles/update-fields.ts` allowlist (editor fields only); `status` validated; `publishedAt` server-managed; body sanitised | `article-fields.test.ts` |
| 8 | AI Enhance silently changed the slug of existing articles (breaks the public URL) | `ArticleEditor` | Slug only auto-derived for **new** articles (same rule already used when typing a title) | code review |
| 9 | Public AI endpoint generated for unpublished/draft IDs and echoed raw OpenAI errors | `GET /api/articles/perspectives/[id]` | Restricted to `status='published'`; generic error. (Already bounded: results stored per article.) | code review |
| 10 | Auth checked **after** side-effecting setup | `POST /api/push/send` | Auth moved first | `routes.test.ts` |
| 11 | Credentials in source control | `server/workers/telegram-session.txt` (MTProto user session), Telegram `API_ID`/`API_HASH` literals, worker/migration logs | Session + 5 log files untracked (`git rm --cached`, files stay on disk), `.gitignore` rules added, API credentials moved to `TELEGRAM_API_ID` / `TELEGRAM_API_HASH` env (fail if absent) | `git status`, static review |

## 2. Route classification (after Stage 0)

Generated from the code on this branch. `BROKEN/UNPROTECTED` remaining: **none**.

| Route | Method | Classification | Note |
|---|---|---|---|
| `/api/accountability` | GET | PUBLIC READ |  |
| `/api/admin/accountability/[id]` | PATCH | ADMIN SESSION |  |
| `/api/admin/accountability/[id]` | DELETE | ADMIN SESSION |  |
| `/api/admin/accountability` | POST | ADMIN SESSION |  |
| `/api/admin/ai/enhance` | POST | ADMIN SESSION |  |
| `/api/admin/articles/[id]` | GET | ADMIN SESSION |  |
| `/api/admin/articles/[id]` | PUT | ADMIN SESSION |  |
| `/api/admin/articles/[id]` | DELETE | ADMIN SESSION |  |
| `/api/admin/articles/kill-breaking` | POST | ADMIN SESSION |  |
| `/api/admin/articles` | GET | ADMIN SESSION |  |
| `/api/admin/articles` | POST | ADMIN SESSION or MACHINE AUTH |  |
| `/api/admin/articles` | DELETE | ADMIN SESSION |  |
| `/api/admin/articles/score/[id]` | POST | ADMIN SESSION |  |
| `/api/admin/auth/login` | POST | INTENTIONALLY PUBLIC WRITE | credential check |
| `/api/admin/comments/[id]` | PUT | ADMIN SESSION |  |
| `/api/admin/comments/ban` | POST | ADMIN SESSION |  |
| `/api/admin/comments/reply` | POST | ADMIN SESSION |  |
| `/api/admin/comments` | GET | ADMIN SESSION |  |
| `/api/admin/exile-voices/[id]` | PATCH | ADMIN SESSION |  |
| `/api/admin/exile-voices/[id]` | DELETE | ADMIN SESSION |  |
| `/api/admin/live-updates/[id]` | DELETE | ADMIN SESSION |  |
| `/api/admin/live-updates` | POST | ADMIN SESSION |  |
| `/api/admin/logout` | GET | PUBLIC (clears own cookie) |  |
| `/api/admin/newsletter/articles` | GET | ADMIN SESSION |  |
| `/api/admin/newsletter/generate` | POST | ADMIN SESSION |  |
| `/api/admin/newsletter/send` | POST | ADMIN SESSION |  |
| `/api/admin/newsletter/subscribers` | GET | ADMIN SESSION |  |
| `/api/admin/upload` | POST | ADMIN SESSION |  |
| `/api/articles/breaking` | GET | PUBLIC READ |  |
| `/api/articles/follow-up/[id]` | GET | PUBLIC READ |  |
| `/api/articles/heat/[id]` | GET | PUBLIC READ |  |
| `/api/articles/perspectives/[id]` | GET | PUBLIC READ |  |
| `/api/articles/timeline/[id]` | GET | PUBLIC READ |  |
| `/api/comments` | GET | PUBLIC READ |  |
| `/api/comments` | POST | INTENTIONALLY PUBLIC WRITE | reader comments (ban list + moderation) |
| `/api/debug/categories` | GET | PUBLIC READ |  |
| `/api/digest/weekly` | POST | MACHINE AUTH |  |
| `/api/exile-voices` | GET | PUBLIC READ |  |
| `/api/exile/submit` | POST | INTENTIONALLY PUBLIC WRITE | reader submissions (moderated) |
| `/api/feed` | GET | PUBLIC READ |  |
| `/api/geo/track` | POST | INTENTIONALLY PUBLIC WRITE | visit analytics |
| `/api/geo/track` | GET | PUBLIC READ |  |
| `/api/hit/[id]` | POST | INTENTIONALLY PUBLIC WRITE | view counter |
| `/api/internal/legacy-redirect` | GET | PUBLIC READ |  |
| `/api/live-updates/[articleId]` | GET | PUBLIC READ |  |
| `/api/maintenance-login` | POST | INTENTIONALLY PUBLIC WRITE | password-checked bypass |
| `/api/n8n/claude` | POST | MACHINE AUTH |  |
| `/api/n8n/openai` | POST | MACHINE AUTH |  |
| `/api/n8n/social` | POST | MACHINE AUTH |  |
| `/api/news-sitemap` | GET | PUBLIC READ |  |
| `/api/newsletter/subscribe` | POST | INTENTIONALLY PUBLIC WRITE | newsletter sign-up |
| `/api/push/send` | POST | MACHINE AUTH |  |
| `/api/push/subscribe` | POST | INTENTIONALLY PUBLIC WRITE | push opt-in |
| `/api/pwa/track` | POST | INTENTIONALLY PUBLIC WRITE | PWA analytics |
| `/api/reactions/[id]` | GET | PUBLIC READ |  |
| `/api/reactions/[id]` | POST | INTENTIONALLY PUBLIC WRITE | reader reactions |
| `/api/rss` | GET | PUBLIC READ |  |
| `/api/search` | GET | PUBLIC READ |  |
| `/news-sitemap.xml` | GET | PUBLIC READ |  |
| `/rss.xml` | GET | PUBLIC READ |  |

**Totals:** ADMIN SESSION: 24, ADMIN SESSION or MACHINE AUTH: 1, INTENTIONALLY PUBLIC WRITE: 10, MACHINE AUTH: 5, PUBLIC (clears own cookie): 1, PUBLIC READ: 19

**BROKEN/UNPROTECTED remaining:** none

Intentionally public writes are reader features (comments, reactions, sign-ups, analytics counters, submissions) plus the two credential-checking login endpoints.

## 3. Verification

| Check | Branch (Stage 0) | Baseline `main` | Result |
|---|---|---|---|
| `npm test` (new: `tsx --test`, Node test runner, no new dependencies) | **54 / 54 pass** | — | PASS |
| `npm run typecheck` (`tsc --noEmit`, script added) | 0 errors | 0 errors | PASS |
| `npm run lint` | 44 errors, 33 warnings | 44 errors, 34 warnings | No new errors; one fewer warning. All remaining findings pre-exist in unchanged code (`no-explicit-any`, `react-hooks/set-state-in-effect`, …). |
| `npm run build` | exit 0, 69/69 pages | — | PASS (only warning: pre-existing workspace-root inference from multiple lockfiles) |

Tests force dummy DB/JWT/key values, so they never touch a real database or real credentials. Coverage: unauthenticated / forged / junk-cookie mutation → 401; valid session permitted; invalid and `NEXT_PUBLIC` machine keys → 401; machine key cannot act as a session; login & maintenance fail closed without secrets; allowlist drops system fields and keeps the editor payload; body sanitisation; repository-wide static scans (no un-awaited `verifyToken`, no `NEXT_PUBLIC` credential, no secret fallback literal, every `admin/*` and `n8n/*` handler guarded).

## 4. Remaining issues (not fixed in Stage 0 — by design or out of scope)

| Severity | Issue | Why not now |
|---|---|---|
| HIGH | Git **history** still contains the Telegram session string and logs (public repo). | Stage 0 forbids history rewrite. Rotation/revocation is the real invalidation (see §5). |
| HIGH | `POST /api/admin/articles` with the machine key can still publish directly (n8n workflows choose `draft` by convention). | Changing it alters editorial behaviour; belongs to Stage 1 (signed newsroom API / per-operation permissions). |
| MEDIUM | No login rate limiting; logout is a `GET`; single shared admin account; 7-day non-revocable JWT. | Requires design (Stage 1 users/grants). |
| MEDIUM | Anonymous `POST /api/comments` runs AI moderation per comment (cost exposure). | Reader feature; needs rate limiting design. |
| MEDIUM | Maintenance bypass cookie stores the raw password. | Hardening (HMAC token) noted on `backup/dirty-local-before-sync`; not required for Stage 0. |
| MEDIUM | Article `DELETE` is a hard delete; slug/category changes write no redirect; no audit log. | Stage 1 (audit, soft delete). |
| LOW | `/api/debug/categories` is public (public data only). | Harmless; remove later. |
| LOW | Newsletter links point to a non-existent `/api/newsletter/unsubscribe`. | Functional bug; the backup branch has a draft route. |
| LOW | The article PUT's server-to-server call to `/api/admin/articles/score/[id]` still never authenticates (pre-existing; `cc_score` stays unset). | Behaviour unchanged deliberately. |
| INFO | Pre-existing lint errors (44) unrelated to Stage 0. | See §3. |

### `backup/dirty-local-before-sync`
Inspected, **not merged**. Its route guards are a subset of Stage 0 and were written against older code (`NEXT_PUBLIC_SITE_URL`, different revalidation). It also contains scripts with an embedded production key — **do not push that branch**. Ideas worth a later stage: HMAC maintenance token, proxy rate-limits, newsletter unsubscribe route.

## 5. External owner actions (cannot be done from code)

1. **Revoke the Telegram session** — Telegram → Settings → Devices → terminate the session used by the ingest worker. Then create new API credentials at my.telegram.org and put them in `.env.local` as `TELEGRAM_API_ID` / `TELEGRAM_API_HASH` (only if the local worker is still needed).
2. **Rotate `AUTOMATION_API_KEY`** (Vercel + n8n credential/env). It was exposed in a workflow file on disk and in an audit agent's output on 2026-10-06.
3. **Rotate `ADMIN_PASSWORD` and `JWT_SECRET`** (fallback values were public in the repo; rotating `JWT_SECRET` also logs out every existing session).
4. **Confirm in Vercel** that `ADMIN_PASSWORD`, `JWT_SECRET`, `AUTOMATION_API_KEY`, `MAINTENANCE_PASSWORD` are set for Production — without them, login/automation now fail closed (by design).
5. **Delete `NEXT_PUBLIC_AUTOMATION_API_KEY`** from Vercel if it exists (it is no longer read; if it was ever set, its value was public — rotate it too).
6. Decide on Git history clean-up (separate, coordinated task).

## 6. Deployment notes

- Before deploy, owner reviews the diff on `stage-0/security-remediation`.
- After deploy, smoke test: admin login → edit/save draft → unpublish/republish a **test** article → QuickPublish preview; confirm n8n "Concord — Content Publishing" run succeeds (it uses `/api/admin/articles` + `/api/n8n/claude` with `AUTOMATION_API_KEY`, unchanged).
- Rollback: Vercel instant rollback to the previous deployment; no database changes were made.

## 7. Preview verification (2026-10-06)

Preview was tested through the owner's browser session (Vercel Deployment Protection stays on; no bypass secret was created). **Preview shares the production database and R2 bucket**, so all article testing was draft-only and nothing was published.

| Area | Result |
|---|---|
| Preview env var names | Required names present (ADMIN_PASSWORD, ADMIN_USERNAME, JWT_SECRET, AUTOMATION_API_KEY, DB_*, R2_*). MAINTENANCE_PASSWORD absent (maintenance mode is off). |
| Public site | Homepage, article, category, RSS, sitemap → 200; R2 and external images load; layout unchanged. |
| Admin | Invalid login → 401 (no cookie); owner login works; dashboard, article list, editor and admin APIs → 200. |
| Authorization | All anonymous / junk-cookie / forged-JWT / invalid-key probes → 401 (logged server-side as 401). |
| Draft workflow | Test draft `[STAGE-0 PREVIEW TEST — DELETE ME]` created, reopened (API + editor), edited: slug unchanged, forced system fields ignored, invalid status → 400; deleted → 404. No test record remains. |
| Logs | No error/warning-level entries, no AI calls, no social posting, no n8n traffic other than rejected probes. |
| Not verifiable on Preview | Valid automation key acceptance (would expose the key in a request) and n8n execution history (n8n API behind Cloudflare Access) — confirm with an n8n run at the production gate after key rotation. |
| Env finding | **`NEXT_PUBLIC_AUTOMATION_API_KEY` is set in Vercel (all environments).** `main`'s QuickPublish referenced it in client code, so its value has been in the public production JS bundle → delete it and treat the value as exposed before production. OPENAI_API_KEY is not set in Vercel (pre-existing; AI routes fall back to Anthropic or return 503). |
| Preview URL | concord2026-g14ki22m3-buddy1974s-projects.vercel.app (commit 6b38ba7) |
