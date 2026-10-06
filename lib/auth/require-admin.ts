/**
 * Centralised admin auth helper.
 * Use this in every /api/admin/* route handler instead of
 * copy-pasting the cookie-verify block.
 *
 * Usage:
 *   const auth = await requireAdmin(req)
 *   if (!auth.ok) return auth.response
 *   // auth.admin is now the verified AdminPayload
 *
 * Passing `req` reads the cookie from the request itself; without it the
 * helper falls back to next/headers (server components / legacy callers).
 */
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { verifyToken, type AdminPayload } from './index'

type AuthOk    = { ok: true;  admin: AdminPayload }
type AuthFail  = { ok: false; response: NextResponse }
type AuthResult = AuthOk | AuthFail

export const ADMIN_COOKIE = 'admin_token'

function unauthorized(): AuthFail {
  return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
}

/** Verifies an admin session token. Always awaited — never truthy-check the Promise. */
export async function verifyAdminToken(token: string | null | undefined): Promise<AdminPayload | null> {
  if (!token) return null
  return verifyToken(token)
}

export async function requireAdmin(req?: NextRequest): Promise<AuthResult> {
  const token = req
    ? req.cookies.get(ADMIN_COOKIE)?.value
    : (await cookies()).get(ADMIN_COOKIE)?.value
  const admin = await verifyAdminToken(token)
  if (!admin) return unauthorized()
  return { ok: true, admin }
}
