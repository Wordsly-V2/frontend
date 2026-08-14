"use client";

import { shouldWarm, warmOfflineCache } from "@/lib/offline/warmup";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthSession } from "./useAuthSession.hook";
import { useOnlineStatus } from "./useOnlineStatus.hook";

/**
 * Warm the offline cache on idle, once the app is online and the identity has
 * been confirmed live. Runs in the background and never surfaces state — see
 * lib/offline/warmup.ts for the budget and entry conditions.
 */
export function useOfflineWarmup(): void {
    const queryClient = useQueryClient();
    const onlineStatus = useOnlineStatus();
    const { canSync } = useAuthSession();

    useEffect(() => {
        if (onlineStatus !== "online" || !canSync) return;
        if (document.visibilityState !== "visible") return;

        let cancelled = false;

        const run = () => {
            void shouldWarm().then((ok) => {
                if (ok && !cancelled) void warmOfflineCache(queryClient);
            });
        };

        // Wait for the main thread to be free: warming is the least urgent thing
        // the app does, and it issues several requests.
        const idle = window.requestIdleCallback
            ? window.requestIdleCallback(run, { timeout: 10_000 })
            : window.setTimeout(run, 3_000);

        return () => {
            cancelled = true;
            if (window.cancelIdleCallback && typeof idle === "number") {
                window.cancelIdleCallback(idle);
            } else {
                clearTimeout(idle as number);
            }
        };
    }, [canSync, onlineStatus, queryClient]);
}
