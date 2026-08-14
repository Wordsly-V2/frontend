import { openDB, type IDBPDatabase } from 'idb';

/**
 * One IndexedDB database for everything offline, so wiping a user's local data
 * is a single delete. Separate stores so clearing the cached query data can
 * never take unsynced practice answers with it.
 */
const DB_NAME = 'wordsly-offline';
const DB_VERSION = 1;

export const STORE_QUERY_CACHE = 'query-cache';
export const STORE_SYNC_QUEUE = 'sync-queue';
export const STORE_META = 'meta';

/** Bump when a persisted shape changes; the old blob is then discarded. */
export const OFFLINE_SCHEMA_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

export function isIdbAvailable(): boolean {
	return typeof indexedDB !== 'undefined';
}

export function getOfflineDb(): Promise<IDBPDatabase> {
	dbPromise ??= openDB(DB_NAME, DB_VERSION, {
		upgrade(db) {
			if (!db.objectStoreNames.contains(STORE_QUERY_CACHE)) {
				// Keyed by `rq:<userLoginId>` so two accounts on one device never
				// read each other's cache.
				db.createObjectStore(STORE_QUERY_CACHE);
			}
			if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
				const queue = db.createObjectStore(STORE_SYNC_QUEUE, {
					keyPath: 'id',
				});
				queue.createIndex('by-user', 'userLoginId');
				queue.createIndex('by-next-attempt', 'nextAttemptAt');
			}
			if (!db.objectStoreNames.contains(STORE_META)) {
				db.createObjectStore(STORE_META);
			}
		},
		blocking() {
			// Another tab is upgrading; let go so it can proceed.
			void dbPromise?.then((db) => db.close());
			dbPromise = null;
		},
	});
	return dbPromise;
}

export async function readMeta<T>(key: string): Promise<T | undefined> {
	if (!isIdbAvailable()) return undefined;
	const db = await getOfflineDb();
	return (await db.get(STORE_META, key)) as T | undefined;
}

export async function writeMeta(key: string, value: unknown): Promise<void> {
	if (!isIdbAvailable()) return;
	const db = await getOfflineDb();
	await db.put(STORE_META, value, key);
}

/** Drop the persisted query cache. Never touches the sync queue. */
export async function clearQueryCacheStore(): Promise<void> {
	if (!isIdbAvailable()) return;
	const db = await getOfflineDb();
	await db.clear(STORE_QUERY_CACHE);
}
