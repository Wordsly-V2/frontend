"use client";

import { useSyncExternalStore } from "react";
import {
    getOnlineStatus,
    subscribeToOnlineStatus,
    type OnlineStatus,
} from "@/lib/offline/online-status";

/** Server render optimistically assumes online; the client corrects on hydrate. */
const getServerSnapshot = (): OnlineStatus => "online";

/**
 * Connectivity as the app actually experiences it — driven by real API
 * outcomes, not just `navigator.onLine`. See `lib/offline/online-status.ts`.
 */
export function useOnlineStatus(): OnlineStatus {
    return useSyncExternalStore(
        subscribeToOnlineStatus,
        getOnlineStatus,
        getServerSnapshot,
    );
}

export function useIsOffline(): boolean {
    return useOnlineStatus() === "offline";
}
