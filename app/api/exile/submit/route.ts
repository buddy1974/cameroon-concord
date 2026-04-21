import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { exileSubmissions } from '@/lib/db/schema'
import { createHash } from 'crypto'

export async function POST(req: NextRequest) {
  const { content, region, category } = await req.json()

  if (!content || content.trim().length < 50) {
    return NextResponse.json({ error: 'Submission too short — minimum 50 characters' }, { status: 400 })
  }
  if (content.length > 10000) {
    return NextResponse.json({ error: 'Submission too long — maximum 10,000 characters' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const ipHash = createHash('sha256').update(ip + process.env.JWT_SECRET).digest('hex').slice(0, 32)

  await db.insert(exileSubmissions).values({
    content:  content.trim(),
    region:   region?.trim() || null,
    category: category || 'general',
    ipHash,
  })

  return NextResponse.json({ ok: true })
}
