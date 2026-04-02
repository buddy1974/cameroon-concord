import { NextRequest, NextResponse } from 'next/server'
import { searchArticles } from '@/lib/db/queries'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || ''
  if (!q.trim() || q.trim().length < 2) {
    return NextResponse.json({ articles: [] })
  }
  try {
    const articles = await searchArticles(q, 20)
    return NextResponse.json({ articles })
  } catch {
    return NextResponse.json({ articles: [] })
  }
}
