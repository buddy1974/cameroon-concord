import { NextRequest, NextResponse } from 'next/server'
import { incrementHit } from '@/lib/db/queries'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const articleId = parseInt(id)
  if (isNaN(articleId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }
  try {
    await incrementHit(articleId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
