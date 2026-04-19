import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type {
  articles, categories, authors, tags,
  articleTags, articleHits, media, redirects,
  publishingQueue, publishLog, socialQueue, comments,
} from '@/lib/db/schema'

export type Article          = InferSelectModel<typeof articles>
export type NewArticle       = InferInsertModel<typeof articles>
export type Category         = InferSelectModel<typeof categories>
export type NewCategory      = InferInsertModel<typeof categories>
export type Author           = InferSelectModel<typeof authors>
export type NewAuthor        = InferInsertModel<typeof authors>
export type Tag              = InferSelectModel<typeof tags>
export type ArticleTag       = InferSelectModel<typeof articleTags>
export type ArticleHit       = InferSelectModel<typeof articleHits>
export type Media            = InferSelectModel<typeof media>
export type Redirect         = InferSelectModel<typeof redirects>
export type PublishingQueue  = InferSelectModel<typeof publishingQueue>
export type PublishLog       = InferSelectModel<typeof publishLog>
export type SocialQueue      = InferSelectModel<typeof socialQueue>
export type Comment          = InferSelectModel<typeof comments>
export type NewComment       = InferInsertModel<typeof comments>

export type ArticleStatus = 'draft' | 'scheduled' | 'published' | 'archived'
export type Platform      = 'twitter' | 'facebook' | 'whatsapp' | 'instagram' | 'telegram'
export type PublishSource = 'web' | 'api' | 'mobile' | 'script' | 'ai'

export type ArticleWithRelations = Article & {
  category: Category
  author:   Author | null
  tags:     Tag[]
  hits:     number
  summary?: string[] | null
}
