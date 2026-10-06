import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { articles, categories, articleHits } from '@/lib/db/schema';
import { eq, desc, like, and } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const catSlug = searchParams.get('category') || '';
  const type = searchParams.get('type') || '';

  if (type === 'most_read') {
    const rows = await db.select({
      id: articles.id, title: articles.title, slug: articles.slug,
      excerpt: articles.excerpt, featuredImage: articles.featuredImage,
      hits: articleHits.hits, catSlug: categories.slug, catName: categories.name,
    }).from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(articleHits, eq(articles.id, articleHits.articleId))
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articleHits.hits)).limit(10);
    return NextResponse.json(rows);
  }

  const conditions: any[] = [eq(articles.status, 'published')];
  if (search) conditions.push(like(articles.title, `%${search}%`));
  if (catSlug) conditions.push(eq(categories.slug, catSlug));

  const rows = await db.select({
    id: articles.id, title: articles.title, slug: articles.slug,
    excerpt: articles.excerpt, featuredImage: articles.featuredImage,
    hits: articleHits.hits, catSlug: categories.slug, catName: categories.name,
    publishedAt: articles.publishedAt,
  }).from(articles)
  .innerJoin(categories, eq(articles.categoryId, categories.id))
  .leftJoin(articleHits, eq(articles.id, articleHits.articleId))
  .where(and(...conditions))
  .orderBy(desc(articles.publishedAt)).limit(20);

  return NextResponse.json(rows);
}
