import { NextRequest, NextResponse } from 'next/server'
import { safeEqual } from './safe-compare'
import { requireAdmin } from './require-admin'

type AutomationOk = { ok: true }
type AutomationFail = { ok: false; response: NextResponse }
type AutomationResult = AutomationOk | AutomationFail

export type AutomationKeyCheck = 'ok' | 'unconfigured' | 'invalid'

/**
 * Server-only machine key check. Only AUTOMATION_API_KEY is honoured —
 * a NEXT_PUBLIC_* variable must never authenticate anything.
 */
export function checkAutomationKey(provided: string | null | undefined): AutomationKeyCheck {
  const configuredKey = process.env.AUTOMATION_API_KEY
  if (!configuredKey) return 'unconfigured'
  return safeEqual(provided, configuredKey) ? 'ok' : 'invalid'
}

export function requireAutomation(req: NextRequest): AutomationResult {
  const result = checkAutomationKey(req.headers.get('x-api-key'))
  if (result === 'unconfigured') {
    console.error('[automation] AUTOMATION_API_KEY is not configured')
    return {
      ok: false,
      response: NextResponse.json({ error: 'Automation auth is not configured' }, { status: 503 }),
    }
  }
  if (result === 'invalid') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  return { ok: true }
}

type ActorResult =
  | { ok: true; actor: 'admin' | 'automation' }
  | { ok: false; response: NextResponse }

/**
 * Machine key when an x-api-key header is present, otherwise the admin session.
 * A request carrying a wrong key is rejected — it does not fall through to the cookie.
 */
export async function requireAdminOrAutomation(req: NextRequest): Promise<ActorResult> {
  if (req.headers.get('x-api-key')) {
    const automation = requireAutomation(req)
    return automation.ok ? { ok: true, actor: 'automation' } : automation
  }
  const auth = await requireAdmin(req)
  return auth.ok ? { ok: true, actor: 'admin' } : auth
}
