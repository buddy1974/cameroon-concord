/**
 * Centralised admin auth helper.
 * Use this in every /api/admin/* route handler instead of
 * copy-pasting the cookie-verify block.
 *
 * Usage:
 *   const auth = await requireAdmin()
 *   if (!auth.ok) return auth.response
 *   // auth.admin is now the verified AdminPayload
 */
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyToken, type AdminPayload } from './index'

type AuthOk    = { ok: true;  admin: AdminPayload }
type AuthFail  = { ok: false; response: NextResponse }
type AuthResult = AuthOk | AuthFail

export async function requireAdmin(): Promise<AuthResult> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const admin = await verifyToken(token)
  if (!admin) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { ok: true, admin }
}
