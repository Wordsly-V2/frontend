"use client";

import {
    getAllSyncRecords,
    subscribeToSyncQueue,
    type SyncRecord,
} from "@/lib/offline/sync-queue";
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
 */
export function useSyncQueueStatus(): SyncQueueStatus {
    const [records, setRecords] = useState<SyncRecord[]>([]);

    const refresh = useCallback(() => {
        void getAllSyncRecords().then(setRecords);
    }, []);

    useEffect(() => {
        refresh();
        return subscribeToSyncQueue(refresh);
    }, [refresh]);

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
