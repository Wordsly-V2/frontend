"use client";

import { useAuthSession } from "@/hooks/useAuthSession.hook";
import { useOfflineWarmup } from "@/hooks/useOfflineWarmup.hook";
import { useOnlineStatus } from "@/hooks/useOnlineStatus.hook";
import { MSG_FLUSH_SYNC } from "@/lib/offline/media-cache";
import { flushSyncQueue, type FlushReason } from "@/lib/offline/sync-flush";
import { migrateLegacyPendingSaves } from "@/lib/offline/sync-queue-migration";
import { releaseQuarantinedRecords } from "@/lib/offline/sync-queue";
import { queryKeys } from "@/lib/query-keys";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProfile } from "@/store/slices/userSlice";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

/** How often to retry while records are still waiting. */
const RETRY_INTERVAL_MS = 60_000;

/**
 * Owns every offline side effect that has to run app-wide: draining the sync
 * queue on each of the several signals that mean "we might be back", and warming
 * the cache so a session is available next time there is no network.
 *
 * Rendered inside the cache provider so a restored cache is available to it.
 */
export default function OfflineBootstrap() {
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    const onlineStatus = useOnlineStatus();
    const { canSync } = useAuthSession();
    const profile = useAppSelector((state) => state.user.profile);
    const userLoginId = profile?.id ?? null;

    const hasMigrated = useRef(false);

    useOfflineWarmup();

    const flush = useCallback(
        (reason: FlushReason) => {
            void flushSyncQueue({ userLoginId, canSync, reason });
        },
        [canSync, userLoginId],
    );

    // One-time move of anything left in the old localStorage outbox, plus an
    // offer of work that was parked when this account was last signed out.
    useEffect(() => {
        if (!userLoginId || hasMigrated.current) return;
        hasMigrated.current = true;

        void (async () => {
            await migrateLegacyPendingSaves(userLoginId);
            await releaseQuarantinedRecords(userLoginId);
            flush("mount");
        })();
    }, [flush, userLoginId]);

    // A live identity check is the only thing that unlocks sending, so flush as
    // soon as one lands.
    useEffect(() => {
        if (canSync) flush("verified");
    }, [canSync, flush]);

    // Reconnecting: re-verify (the access token has almost certainly expired
    // while offline) and drop any due-word list we guessed at locally.
    useEffect(() => {
        if (onlineStatus !== "online") return;

        void dispatch(fetchProfile({ force: true }));
        void queryClient.invalidateQueries({
            queryKey: queryKeys.dueWordIds.all,
        });
        flush("online");
    }, [dispatch, flush, onlineStatus, queryClient]);

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === "visible") flush("visible");
        };
        document.addEventListener("visibilitychange", onVisible);
        return () =>
            document.removeEventListener("visibilitychange", onVisible);
    }, [flush]);

    // The service worker cannot send the answers itself (it has no access to the
    // token), so a Background Sync wake-up just asks the page to do it.
    useEffect(() => {
        if (typeof navigator === "undefined" || !navigator.serviceWorker) return;

        const onMessage = (event: MessageEvent) => {
            if ((event.data as { type?: string })?.type === MSG_FLUSH_SYNC) {
                flush("sw-message");
            }
        };
        navigator.serviceWorker.addEventListener("message", onMessage);
        return () =>
            navigator.serviceWorker.removeEventListener("message", onMessage);
    }, [flush]);

    // Backstop for the case where none of the events above fire (a long-lived
    // tab on a flaky connection).
    useEffect(() => {
        const interval = setInterval(
            () => flush("interval"),
            RETRY_INTERVAL_MS,
        );
        return () => clearInterval(interval);
    }, [flush]);

    return null;
}
