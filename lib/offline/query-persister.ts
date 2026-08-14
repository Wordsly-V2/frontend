import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { PersistQueryClientOptions } from "@tanstack/react-query-persist-client";
import {
    getOfflineDb,
    isIdbAvailable,
    OFFLINE_SCHEMA_VERSION,
    STORE_QUERY_CACHE,
} from "./idb";
import { OFFLINE_GRACE_MS } from "./auth-session";
import { shouldDehydrateQuery } from "./persist-allowlist";

/**
 * Persist the React Query cache to IndexedDB so the app has data to render when
 * there is no network.
 *
 * IndexedDB rather than localStorage: the dehydrated cache runs to megabytes,
 * which would blow the 5MB localStorage budget, and an async store keeps the
 * serialization off the main thread. Media stays in the Cache API, so only JSON
 * lands here.
 */

const idbStorage = {
    async getItem(key: string): Promise<string | null> {
        const db = await getOfflineDb();
        return (await db.get(STORE_QUERY_CACHE, key)) ?? null;
    },
    async setItem(key: string, value: string): Promise<void> {
        const db = await getOfflineDb();
        await db.put(STORE_QUERY_CACHE, value, key);
    },
    async removeItem(key: string): Promise<void> {
        const db = await getOfflineDb();
        await db.delete(STORE_QUERY_CACHE, key);
    },
};

export function cacheKeyForUser(userLoginId: string): string {
    return `rq:${userLoginId}`;
}

/**
 * Persist options for one signed-in user, or null when there is nobody to scope
 * the cache to — an anonymous visitor gets no disk cache at all.
 *
 * The cache is keyed per user so two accounts on one device can never read each
 * other's data, and expires with the same window that governs offline access:
 * learning data must not outlive the identity allowed to read it.
 */
export function buildPersistOptions(
    userLoginId: string | null,
): Omit<PersistQueryClientOptions, "queryClient"> | null {
    if (!userLoginId || !isIdbAvailable()) return null;

    return {
        persister: createAsyncStoragePersister({
            storage: idbStorage,
            key: cacheKeyForUser(userLoginId),
            throttleTime: 2000,
        }),
        maxAge: OFFLINE_GRACE_MS,
        // Discards the whole stored blob when a persisted shape changes.
        buster: `v${OFFLINE_SCHEMA_VERSION}`,
        dehydrateOptions: { shouldDehydrateQuery },
    };
}
