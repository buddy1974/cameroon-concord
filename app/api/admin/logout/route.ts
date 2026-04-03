import { NextResponse } from 'next/server'

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cameroon-concord.com'
  const res = NextResponse.redirect(new URL('/admin/login', siteUrl))
  res.cookies.delete('admin_token')
  return res
}
