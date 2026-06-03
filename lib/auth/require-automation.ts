import { NextRequest, NextResponse } from 'next/server'

type AutomationOk = { ok: true }
type AutomationFail = { ok: false; response: NextResponse }
type AutomationResult = AutomationOk | AutomationFail

export function requireAutomation(req: NextRequest): AutomationResult {
  const configuredKey = process.env.AUTOMATION_API_KEY
  if (!configuredKey) {
    console.error('[automation] AUTOMATION_API_KEY is not configured')
    return {
      ok: false,
      response: NextResponse.json({ error: 'Automation auth is not configured' }, { status: 503 }),
    }
  }

  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== configuredKey) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { ok: true }
}
