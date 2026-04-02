import { NextRequest, NextResponse } from 'next/server'
import { createComment, getApprovedComments } from '@/lib/db/queries'
import { z } from 'zod'

const CommentSchema = z.object({
  articleId:   z.number().int().positive(),
  parentId:    z.number().int().positive().optional(),
  authorName:  z.string().min(2).max(100).trim(),
  authorEmail: z.string().email().max(200).trim(),
  body:        z.string().min(3).max(2000).trim(),
  cfToken:     z.string().min(1),
})

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // skip in dev if not set
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  })
  const data = await res.json() as { success: boolean }
  return data.success
}

export async function GET(req: NextRequest) {
  const articleId = parseInt(req.nextUrl.searchParams.get('articleId') || '0')
  if (!articleId) return NextResponse.json({ error: 'Missing articleId' }, { status: 400 })
  const comments = await getApprovedComments(articleId)
  return NextResponse.json({ comments })
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = CommentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const ip = req.headers.get('cf-connecting-ip')
      || req.headers.get('x-forwarded-for')
      || '0.0.0.0'

    const valid = await verifyTurnstile(parsed.data.cfToken, ip)
    if (!valid) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
    }

    await createComment({
      articleId:   parsed.data.articleId,
      parentId:    parsed.data.parentId ?? null,
      authorName:  parsed.data.authorName,
      authorEmail: parsed.data.authorEmail,
      body:        parsed.data.body,
      status:      'pending',
      ipAddress:   ip,
      userAgent:   req.headers.get('user-agent') || '',
    })

    return NextResponse.json({ ok: true, message: 'Comment submitted for review' })
  } catch (err) {
    console.error('Comment error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
