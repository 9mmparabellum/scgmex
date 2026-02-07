/**
 * Offline Sync Queue
 * Uses IndexedDB for persistent offline operation queue.
 * Automatically retries when connection is restored.
 */

import { supabase } from '../config/supabase';

const DB_NAME = 'scgmex_offline';
const DB_VERSION = 1;
const STORE_NAME = 'sync_queue';

// ═══ IndexedDB Setup ═══════════════════════════════════════════════════

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('table', 'table', { unique: false });
      }
    };
  });
}

// ═══ Queue Operations ══════════════════════════════════════════════════

/**
 * Add an operation to the offline sync queue.
 * @param {Object} operation
 * @param {'create'|'update'|'delete'} operation.type
 * @param {string} operation.table - Supabase table name
 * @param {Object} operation.data  - Row data (must include `id` for update/delete)
 */
export async function addToQueue(operation) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const entry = {
    ...operation,
    status: 'pending',
    timestamp: new Date().toISOString(),
    retries: 0,
    maxRetries: 3,
  };

  store.add(entry);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(entry);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieve every item in the queue (all statuses).
 */
export async function getQueue() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Count items whose status is 'pending'.
 */
export async function getPendingCount() {
  const items = await getQueue();
  return items.filter((i) => i.status === 'pending').length;
}

/**
 * Merge `changes` into an existing queue item.
 */
export async function updateQueueItem(id, changes) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const item = await new Promise((r) => {
    const req = store.get(id);
    req.onsuccess = () => r(req.result);
  });

  if (item) {
    Object.assign(item, changes);
    store.put(item);
  }

  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
}

/**
 * Remove a single item from the queue by id.
 */
export async function removeQueueItem(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);

  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
}

/**
 * Wipe the entire queue.
 */
export async function clearQueue() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).clear();

  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
}

// ═══ Sync Engine ═══════════════════════════════════════════════════════

/**
 * Process every pending item: send to Supabase, then remove on success
 * or mark as failed after maxRetries.
 * @returns {{ synced: number, failed: number, errors: Array }}
 */
export async function syncPendingOperations() {
  const items = await getQueue();
  const pending = items.filter((i) => i.status === 'pending');
  const results = { synced: 0, failed: 0, errors: [] };

  for (const item of pending) {
    try {
      await updateQueueItem(item.id, { status: 'syncing' });

      switch (item.type) {
        case 'create': {
          const { error } = await supabase.from(item.table).insert(item.data);
          if (error) throw error;
          break;
        }
        case 'update': {
          const { id: recordId, ...changes } = item.data;
          const { error } = await supabase
            .from(item.table)
            .update(changes)
            .eq('id', recordId);
          if (error) throw error;
          break;
        }
        case 'delete': {
          const { error } = await supabase
            .from(item.table)
            .delete()
            .eq('id', item.data.id);
          if (error) throw error;
          break;
        }
        default:
          throw new Error(`Unknown operation type: ${item.type}`);
      }

      await removeQueueItem(item.id);
      results.synced++;
    } catch (err) {
      const retries = (item.retries || 0) + 1;
      if (retries >= item.maxRetries) {
        await updateQueueItem(item.id, {
          status: 'failed',
          error: err.message,
          retries,
        });
      } else {
        await updateQueueItem(item.id, { status: 'pending', retries });
      }
      results.failed++;
      results.errors.push({ id: item.id, error: err.message });
    }
  }

  return results;
}

// ═══ Auto-sync on reconnection ═════════════════════════════════════════

let syncInterval = null;
let onlineHandler = null;

/**
 * Start automatic syncing:
 *  - Immediately sync when browser comes back online
 *  - Periodically sync every `intervalMs` while online
 */
export function startAutoSync(intervalMs = 30000) {
  if (syncInterval) return;

  onlineHandler = () => {
    syncPendingOperations();
  };

  window.addEventListener('online', onlineHandler);

  syncInterval = setInterval(async () => {
    if (navigator.onLine) {
      const count = await getPendingCount();
      if (count > 0) {
        await syncPendingOperations();
      }
    }
  }, intervalMs);
}

/**
 * Stop automatic syncing and clean up listeners.
 */
export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  if (onlineHandler) {
    window.removeEventListener('online', onlineHandler);
    onlineHandler = null;
  }
}

// ═══ Cache & Storage Stats ═════════════════════════════════════════════

/**
 * Gather real stats from Cache API, Storage API, and the IndexedDB queue.
 */
export async function getCacheStats() {
  const stats = { totalSize: 0, quota: 0, caches: [] };

  // Real Cache API entries
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      stats.caches.push({ name, entries: keys.length });
    }
  }

  // Real Storage estimation
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    stats.totalSize = estimate.usage || 0;
    stats.quota = estimate.quota || 0;
  }

  // IndexedDB queue counts
  const queue = await getQueue();
  stats.pendingOps = queue.filter((i) => i.status === 'pending').length;
  stats.failedOps = queue.filter((i) => i.status === 'failed').length;
  stats.totalOps = queue.length;

  return stats;
}
