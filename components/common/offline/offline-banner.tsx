"use client";

import { useAuthSession } from "@/hooks/useAuthSession.hook";
import { useOnlineStatus } from "@/hooks/useOnlineStatus.hook";
import { useSyncQueueStatus } from "@/hooks/useSyncQueueStatus.hook";
import UnsyncedWorkDialog from "@/components/common/offline/unsynced-work-dialog";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";
import { AlertCircle, CloudOff, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
    const { pendingCount, failedCount, records } = useSyncQueueStatus();
    const previousPendingCount = useRef(pendingCount);
    const [showFailed, setShowFailed] = useState(false);
    const userLoginId = useAppSelector(
        (state) => state.user.profile?.userLoginId ?? null,
    );
    const failedRecords = records.filter(
        (record) => record.status === "failed-permanent",
    );

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
    const hasFailed = failedCount > 0;

    if (!isOffline && !isSyncing && !hasFailed) return null;

    // Failed work outranks the other two states: it is the only one the learner
    // can actually do something about, and it does not resolve on its own.
    if (hasFailed && !isOffline) {
        return (
            <>
                <div
                    role="status"
                    className={cn(
                        "glass-surface sticky top-0 z-40 flex items-center justify-center gap-2",
                        "px-4 py-2 text-xs font-medium text-muted-foreground",
                    )}
                >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>
                        Some practice hasn&apos;t saved yet — it&apos;s safe on
                        this device.
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowFailed(true)}
                        className="underline underline-offset-2 hover:text-foreground"
                    >
                        Review
                    </button>
                </div>
                <UnsyncedWorkDialog
                    open={showFailed}
                    onOpenChange={setShowFailed}
                    records={failedRecords}
                    userLoginId={userLoginId}
                    canSync={canSync}
                />
            </>
        );
    }

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
