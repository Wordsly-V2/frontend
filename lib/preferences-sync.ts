import type { IAppPreferences } from "@/types/preferences/preferences.type";

/**
 * Client-side glue between the local preference stores (which stay the fast,
 * offline-capable source of truth) and the synced-across-devices server blob.
 *
 * - Each local store setter calls `emitPreferenceChange` with its slice. Emits
 *   are batched and debounced into a single PATCH so a burst of edits (e.g.
 *   toggling several practice options) becomes one request.
 * - When the server blob is fetched, the sync hook applies it to the local
 *   stores inside `withHydration`, which suppresses the echo emit so hydration
 *   never bounces straight back to the server.
 *
 * Kept free of store/React imports so it has no import cycles; the sync hook
 * owns the store <-> server wiring.
 */

type RemotePush = (patch: IAppPreferences) => void;

const FLUSH_DELAY_MS = 600;

let remotePush: RemotePush | null = null;
let pending: IAppPreferences = {};
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let suppressDepth = 0;

function flush(): void {
    if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
    }
    if (!remotePush) return; // not mounted / logged out — keep pending for later
    if (Object.keys(pending).length === 0) return;
    const patch = pending;
    pending = {};
    remotePush(patch);
}

/**
 * Register the function that pushes a patch to the server (the sync hook's
 * mutation). Passing a function flushes anything queued before mount; pass null
 * on unmount/logout so nothing is pushed for a signed-out user.
 */
export function registerRemotePush(fn: RemotePush | null): void {
    remotePush = fn;
    if (fn) flush();
}

/** True while a debounced patch is waiting to be sent. */
export function hasPendingPreferenceWrites(): boolean {
    return flushTimer !== null || Object.keys(pending).length > 0;
}

/** Run `fn` (local-store writes) without echoing the change back to the server. */
export function withHydration(fn: () => void): void {
    suppressDepth++;
    try {
        fn();
    } finally {
        suppressDepth--;
    }
}

/** Queue a preference slice for a debounced server sync. No-op during hydration. */
export function emitPreferenceChange(patch: IAppPreferences): void {
    if (suppressDepth > 0) return;
    pending = { ...pending, ...patch };
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(() => {
        flushTimer = null;
        flush();
    }, FLUSH_DELAY_MS);
}
