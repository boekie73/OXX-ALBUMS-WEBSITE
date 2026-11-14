/**
 * Future private EU storage adapter contract:
 * { ready: true, kind: 'private', region: 'EU',
 *   async create(record): Promise<{ id: string }> }
 * create must atomically persist a unique id and resolve only after durable commit.
 * Encrypt data/backups, isolate credentials, enforce access/retention outside this module.
 * No public read/list/status endpoint is provided.
 */
export class DisabledStorage {
  ready = false;
  kind = 'disabled';
  region = null;
  async create() { throw new Error('storage_not_configured'); }
}
export function storageReady(store) {
  return store?.ready === true && store.kind === 'private' && store.region === 'EU'
    && typeof store.create === 'function';
}
