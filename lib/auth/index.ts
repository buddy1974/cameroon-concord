import { SignJWT, jwtVerify } from 'jose'

// JWT_SECRET is required. There is deliberately no fallback literal: a missing
// secret (or the old publicly-known fallback value) makes signing throw and
// verification deny (fail closed).
const RETIRED_FALLBACK_SECRET = 'fallback-dev-secret-change-in-production'

function getSecret(): Uint8Array | null {
  const raw = process.env.JWT_SECRET
  if (!raw || raw === RETIRED_FALLBACK_SECRET) return null
  return new TextEncoder().encode(raw)
}

export interface AdminPayload {
  sub:   string
  email: string
  role:  'admin' | 'editor'
  iat:   number
  exp:   number
}

export async function signToken(payload: Omit<AdminPayload, 'iat' | 'exp'>): Promise<string> {
  const secret = getSecret()
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<AdminPayload | null> {
  const secret = getSecret()
  if (!secret || !token) return null
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] })
    return payload as unknown as AdminPayload
  } catch {
    return null
  }
}

export async function getAdminFromRequest(req: Request): Promise<AdminPayload | null> {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyToken(auth.replace('Bearer ', ''))
}
