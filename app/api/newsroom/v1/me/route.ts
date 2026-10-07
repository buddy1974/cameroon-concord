import { newsroomRoute } from '@/lib/newsroom/handler'
import { PUBLICATION_KEY } from '@/lib/newsroom/config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const GET = newsroomRoute({ operation: 'me', write: false, minRole: 'viewer' }, async ({ actor }) => ({
  data: { actor: actor.id, role: actor.role, publication: PUBLICATION_KEY },
}))
