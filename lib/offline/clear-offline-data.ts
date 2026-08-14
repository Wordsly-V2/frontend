import { queryClient } from "@/lib/queryClient";
import { clearQueryCacheStore } from "./idb";
import { WORD_MEDIA_CACHE } from "./media-cache";

/**
 * Wipe everything this device cached for a user.
 *
 * Called on logout, when the server rejects the stored identity, and when a
 * different account signs in. Never touches the sync queue: unsynced practice is
 * quarantined rather than destroyed, so a learner who has to sign in again does
 * not silently lose work (see lib/offline/sync-queue.ts).
 */
export async function clearOfflineData(): Promise<void> {
    queryClient.clear();

    await Promise.allSettled([
        clearQueryCacheStore(),
        typeof caches !== "undefined"
            ? caches.delete(WORD_MEDIA_CACHE)
            : Promise.resolve(),
    ]);
}
