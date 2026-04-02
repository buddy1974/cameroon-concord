import { db } from '@/lib/db/client'
import { comments } from '@/lib/db/schema'
import { eq, and, desc, isNull } from 'drizzle-orm'
import type { Comment, NewComment } from '@/lib/types'

export async function getApprovedComments(articleId: number): Promise<Comment[]> {
  return db
    .select()
    .from(comments)
    .where(
      and(
        eq(comments.articleId, articleId),
        eq(comments.status,    'approved'),
        isNull(comments.parentId),
      )
    )
    .orderBy(desc(comments.createdAt))
}

export async function createComment(data: NewComment): Promise<void> {
  await db.insert(comments).values(data)
}
