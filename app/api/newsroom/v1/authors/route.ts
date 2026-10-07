import { newsroomRoute } from '@/lib/newsroom/handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const GET = newsroomRoute({ operation: 'authors.list', write: false, minRole: 'viewer' }, async ({ deps }) => ({
  data: (await deps.store.listAuthors()).map(({ id, slug, name }) => ({ id, slug, name })),
}))
