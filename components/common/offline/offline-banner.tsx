"use client";

import { useAuthSession } from "@/hooks/useAuthSession.hook";
import { useOnlineStatus } from "@/hooks/useOnlineStatus.hook";
import { useSyncQueueStatus } from "@/hooks/useSyncQueueStatus.hook";
import { cn } from "@/lib/utils";
import { CloudOff, RefreshCw } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

function waitingLabel(count: number): string {
    if (count === 0) return "";
    return ` ${count} session${count === 1 ? "" : "s"} waiting to sync.`;
}

/**
 * Slim status bar for connectivity and unsynced work.
 *
 * Copy stays short and reassuring — the learner has done nothing wrong by being
 * offline, and practice still works, so the banner leads with that rather than
 * with the failure.
 */
export default function OfflineBanner() {
    const status = useOnlineStatus();
    const { canSync } = useAuthSession();
    const { pendingCount } = useSyncQueueStatus();
    const previousPendingCount = useRef(pendingCount);

    // One-shot confirmation when the last queued session lands, so a learner who
    // practised offline gets told their work is safe rather than having to guess.
    useEffect(() => {
        if (previousPendingCount.current > 0 && pendingCount === 0) {
            toast.success("All synced", {
                description: "Your offline practice is saved to your account.",
            });
        }
        previousPendingCount.current = pendingCount;
    }, [pendingCount]);

    const isOffline = status === "offline";
    const isSyncing = !isOffline && canSync && pendingCount > 0;

    if (!isOffline && !isSyncing) return null;

    return (
        <div
            role="status"
            className={cn(
                "glass-surface sticky top-0 z-40 flex items-center justify-center gap-2",
                "px-4 py-2 text-xs font-medium text-muted-foreground",
            )}
        >
            {isOffline ? (
                <>
                    <CloudOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>
                        Offline — practice still works.
                        {waitingLabel(pendingCount)}
                    </span>
                </>
            ) : (
                <>
                    <RefreshCw
                        className="h-3.5 w-3.5 shrink-0 animate-spin motion-reduce:animate-none"
                        aria-hidden
                    />
                    <span>Back online — syncing your practice…</span>
                </>
            )}
        </div>
    );
}
