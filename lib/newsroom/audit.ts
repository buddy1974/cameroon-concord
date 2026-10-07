/**
 * Audit trail (contract §10). Records field NAMES only — never bodies,
 * signatures or secrets. An audit failure never fails the request itself.
 */
import type { AuditEntry, NewsroomStore } from './store'

export function auditResultFor(status: number): AuditEntry['result'] {
  if (status < 400) return 'ok'
  if (status === 403) return 'denied'
  return 'error'
}

export async function writeAudit(store: NewsroomStore, entry: AuditEntry): Promise<void> {
  try {
    await store.appendAudit({
      ...entry,
      requestId: entry.requestId.slice(0, 64),
      actor: entry.actor.slice(0, 40),
      operation: entry.operation.slice(0, 40),
      idempotencyKey: entry.idempotencyKey ? entry.idempotencyKey.slice(0, 200) : null,
      errorCode: entry.errorCode ? entry.errorCode.slice(0, 40) : null,
    })
  } catch (err) {
    console.error('[newsroom] audit write failed:', err instanceof Error ? err.name : 'error')
  }
}
