import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { commentBans } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { type, value, reason } = await req.json();
  if (!type || !value) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  await db.insert(commentBans).values({ type, value: value.toLowerCase(), reason });
  return NextResponse.json({ ok: true });
}
