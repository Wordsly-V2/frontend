"use client";

import {
    getSyncRecordsForUser,
    subscribeToSyncQueue,
    type SyncRecord,
} from "@/lib/offline/sync-queue";
import { useAppSelector } from "@/store/hooks";
import { useCallback, useEffect, useState } from "react";

export interface SyncQueueStatus {
    pendingCount: number;
    failedCount: number;
    quarantinedCount: number;
    records: SyncRecord[];
    refresh: () => void;
}

/**
 * Live view of the offline outbox, so the banner and badge can show how much is
 * waiting without polling IndexedDB — the queue notifies on every change.
 *
 * Scoped to the signed-in account, like every other reader of the queue. Reading
 * every record on the device meant that on a shared device the banner counted
 * another account's parked work as this learner's.
 */
export function useSyncQueueStatus(): SyncQueueStatus {
    const [loaded, setLoaded] = useState<SyncRecord[]>([]);
    const userLoginId = useAppSelector(
        (state) => state.user.profile?.userLoginId ?? null,
    );

    const refresh = useCallback(() => {
        if (!userLoginId) return;
        void getSyncRecordsForUser(userLoginId).then(setLoaded);
    }, [userLoginId]);

    useEffect(() => {
        refresh();
        return subscribeToSyncQueue(refresh);
    }, [refresh]);

    // Derived rather than cleared through setState, so signing out cannot leave
    // the previous account's records on screen for a render.
    const records = userLoginId ? loaded : [];

    return {
        records,
        pendingCount: records.filter(
            (record) =>
                record.status === "pending" || record.status === "in-flight",
        ).length,
        failedCount: records.filter(
            (record) => record.status === "failed-permanent",
        ).length,
        quarantinedCount: records.filter(
            (record) => record.status === "quarantined",
        ).length,
        refresh,
    };
}
