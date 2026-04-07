import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { commentBans } from '@/lib/db/schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || !verifyToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, value, reason } = await req.json();
  if (!type || !value) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  await db.insert(commentBans).values({ type, value: value.toLowerCase(), reason });
  return NextResponse.json({ ok: true });
}
