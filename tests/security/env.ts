/**
 * Test environment for security regression tests.
 * Values are FORCED (not defaulted) so a test run can never pick up real
 * credentials or reach a real database. The DB pool is created lazily by
 * mysql2 and every test below is rejected by auth before any query runs.
 */
import { SignJWT } from 'jose'
import { NextRequest } from 'next/server'

export const TEST_JWT_SECRET = 'test-only-jwt-secret-0123456789abcdef'
export const TEST_AUTOMATION_KEY = 'test-only-automation-key-0123456789'

process.env.DB_HOST = '127.0.0.1'
process.env.DB_PORT = '1'
process.env.DB_USER = 'stage0-test'
process.env.DB_PASSWORD = 'stage0-test'
process.env.DB_NAME = 'stage0_test_never_real'
process.env.JWT_SECRET = TEST_JWT_SECRET
process.env.AUTOMATION_API_KEY = TEST_AUTOMATION_KEY
process.env.OPENAI_API_KEY = 'test-only-openai-key'
delete process.env.NEXT_PUBLIC_AUTOMATION_API_KEY

export async function adminToken(secret = TEST_JWT_SECRET): Promise<string> {
  return new SignJWT({ sub: 'admin', email: 'admin', role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret))
}

export function makeRequest(
  url: string,
  init: { method?: string; cookie?: string; apiKey?: string; body?: unknown } = {},
): NextRequest {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (init.cookie !== undefined) headers.set('cookie', `admin_token=${init.cookie}`)
  if (init.apiKey !== undefined) headers.set('x-api-key', init.apiKey)
  return new NextRequest(new URL(url, 'https://example.test'), {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
}

export const idParams = (id = '1') => ({ params: Promise.resolve({ id }) })
