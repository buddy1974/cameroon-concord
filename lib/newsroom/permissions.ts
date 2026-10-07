/**
 * Role matrix (contract §4). The publication — not TM — is the authority.
 */
import { NewsroomError } from './http'
import type { ArticleRecord, NewsroomStore, Role } from './store'
import { SCHEDULER_ACTOR } from './verify'

export const ROLE_RANK: Record<Role, number> = { viewer: 1, contributor: 2, editor: 3, publisher: 4 }

export interface Actor {
  /** Header value, e.g. `telegram:123` or `system:scheduler`. */
  id: string
  kind: 'telegram' | 'system'
  telegramUserId: string | null
  /** null for the system scheduler, which has no editorial role. */
  role: Role | null
}

export function hasRole(actor: Actor, min: Role): boolean {
  return actor.role !== null && ROLE_RANK[actor.role] >= ROLE_RANK[min]
}

/**
 * Resolves the verified actor header to an active grant.
 * Owner bootstrap ids are always an active publisher. The system scheduler
 * is only resolvable on routes that explicitly allow it.
 */
export async function resolveActor(
  actorHeader: string,
  store: Pick<NewsroomStore, 'getGrant'>,
  opts: { ownerTelegramIds: Set<string>; allowScheduler: boolean },
): Promise<Actor> {
  if (actorHeader === SCHEDULER_ACTOR) {
    if (!opts.allowScheduler) throw new NewsroomError('ACTOR_UNKNOWN', 'Unknown actor')
    return { id: actorHeader, kind: 'system', telegramUserId: null, role: null }
  }
  const m = /^telegram:(\d{1,20})$/.exec(actorHeader)
  if (!m) throw new NewsroomError('ACTOR_UNKNOWN', 'Unknown actor')
  const telegramUserId = m[1].replace(/^0+(?=\d)/, '')
  if (opts.ownerTelegramIds.has(telegramUserId)) {
    return { id: `telegram:${telegramUserId}`, kind: 'telegram', telegramUserId, role: 'publisher' }
  }
  const grant = await store.getGrant(telegramUserId)
  if (!grant || !grant.active) throw new NewsroomError('ACTOR_UNKNOWN', 'Unknown actor')
  return { id: `telegram:${telegramUserId}`, kind: 'telegram', telegramUserId, role: grant.role }
}

export function requireRole(actor: Actor, min: Role): void {
  if (!hasRole(actor, min)) throw new NewsroomError('FORBIDDEN', 'Insufficient role for this operation')
}

const EDITABLE_BY_CONTRIBUTOR = new Set(['draft', 'unpublished'])

function isOwnDraft(actor: Actor, article: ArticleRecord): boolean {
  return (
    EDITABLE_BY_CONTRIBUTOR.has(article.status) &&
    actor.telegramUserId !== null &&
    article.originTelegramUserId === actor.telegramUserId
  )
}

/** Update rules: contributors only their own newsroom-created draft; editors+ anything. */
export function canUpdateArticle(actor: Actor, article: ArticleRecord): boolean {
  if (hasRole(actor, 'editor')) return true
  return hasRole(actor, 'contributor') && isOwnDraft(actor, article)
}

/** Media rules: contributors to their own draft or unattached; editors+ to any article. */
export function canAttachMedia(actor: Actor, article: ArticleRecord | null): boolean {
  if (hasRole(actor, 'editor')) return true
  if (!hasRole(actor, 'contributor')) return false
  return article === null || isOwnDraft(actor, article)
}

export function canRunScheduler(actor: Actor): boolean {
  return actor.kind === 'system' || hasRole(actor, 'publisher')
}
