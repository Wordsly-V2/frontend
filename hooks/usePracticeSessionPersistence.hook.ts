import { applyOptimisticWordProgress } from "@/lib/optimistic-word-progress";
import {
    enqueueSyncRecord,
    newClientRequestId,
} from "@/lib/offline/sync-queue";
import { saveSessionResults } from "@/lib/practice-session-persistence";
import { fireCelebrationConfetti } from "@/lib/confetti";
import { queryKeys } from "@/lib/query-keys";
import { userLevelQueryKey } from "@/queries/user-level.query";
import type { SessionCompletePayload } from "@/types/practice/practice.type";
import type { IUserLevel } from "@/types/user-level/user-level.type";
import type {
    ILevelEvent,
    IWordProgressResponse,
} from "@/types/word-progress/word-progress.type";
import { useAppSelector } from "@/store/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * How long the exit overlay waits for an in-flight save before navigating
 * anyway. A save that is merely slow must never trap the learner on the
 * session screen — `saveSessionResults` queues to localStorage on failure and
 * the queue is flushed on the next mount, so leaving early is safe.
 */
const EXIT_SAVE_WAIT_MS = 4000;

/** Result of a live session sync, surfaced to the summary for celebration. */
export interface SessionSyncResult {
    levelEvent?: ILevelEvent;
    xpMultiplier: number;
}

interface UsePracticeSessionPersistenceOptions {
    courseId: string;
    wordIdList: string[];
    progressByWordId: Record<string, IWordProgressResponse | null> | undefined;
}

export function usePracticeSessionPersistence({
    courseId,
    wordIdList,
    progressByWordId,
}: UsePracticeSessionPersistenceOptions) {
    const router = useRouter();
    const queryClient = useQueryClient();
    // Queued work is scoped per account so it can never be sent under another.
    const userLoginId = useAppSelector(
        (state) => state.user.profile?.userLoginId ?? null,
    );
    const [savedOnce, setSavedOnce] = useState(false);
    const [hasUnsavedPractice, setHasUnsavedPractice] = useState(false);
    const [sessionSyncResult, setSessionSyncResult] =
        useState<SessionSyncResult | null>(null);
    const [isSavedOffline, setIsSavedOffline] = useState(false);
    // Only true while LEAVING with a save still in flight — NOT while the
    // background save runs. The background save starts the moment the summary
    // renders, so a blocking overlay bound to it would cover the celebration.
    const [isExiting, setIsExiting] = useState(false);
    const savePromiseRef = useRef<Promise<void> | null>(null);

    const invalidateProgressQueries = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.wordProgress.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.dueWords.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.dueWordIds.all });
    }, [queryClient]);

    // Flushing the offline queue is owned by OfflineBootstrap, which listens for
    // reconnection, tab focus and service-worker wake-ups. It used to happen only
    // here, on mount, so a queued session could sit unsent for an entire session.

    useEffect(() => {
        if (!hasUnsavedPractice) return;
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };
        globalThis.addEventListener("beforeunload", onBeforeUnload);
        return () => globalThis.removeEventListener("beforeunload", onBeforeUnload);
    }, [hasUnsavedPractice]);

    // Refresh the cached level snapshot from a live sync's authoritative level
    // event, so the level UI elsewhere reflects the XP just earned. The visible
    // level-up celebration itself is owned by the session summary.
    const applyLevelEvent = useCallback(
        (levelEvent: ILevelEvent) => {
            const snapshot: IUserLevel = {
                level: levelEvent.level,
                rank: levelEvent.rank,
                totalXp: levelEvent.totalXp,
                currentLevelXp: levelEvent.currentLevelXp,
                xpForThisLevel: levelEvent.xpForThisLevel,
                xpToNextLevel: levelEvent.xpToNextLevel,
                progress: levelEvent.progress,
            };
            queryClient.setQueryData(userLevelQueryKey(), snapshot);
        },
        [queryClient],
    );

    const persistSessionInBackground = useCallback(
        async (payload: SessionCompletePayload) => {
            try {
                const result = await saveSessionResults(payload, userLoginId);
                await invalidateProgressQueries();

                if (result.outcome === "queued") {
                    // Also flagged persistently on the summary: a toast vanishes,
                    // and "did my practice save?" is the one question a learner
                    // should never be left holding.
                    setIsSavedOffline(true);
                    toast.warning("Saved on your device — we'll sync when you're back online.");
                } else {
                    // Live sync: surface the server-authoritative XP/level info to
                    // the summary so it can celebrate with real numbers.
                    if (result.levelEvent) applyLevelEvent(result.levelEvent);
                    setSessionSyncResult({
                        levelEvent: result.levelEvent,
                        xpMultiplier: result.xpMultiplier ?? 1,
                    });
                }
            } catch {
                // saveSessionResults already queues on a failed request, so
                // reaching here means something else went wrong (e.g. the cache
                // invalidation). Queue anyway rather than lose the answers.
                setHasUnsavedPractice(true);
                if (userLoginId) {
                    await enqueueSyncRecord({
                        userLoginId,
                        clientRequestId: newClientRequestId(),
                        op: {
                            kind: "practice-answers",
                            body: { answers: payload.wordResults },
                        },
                    });
                }
                toast.error("Could not save progress. It is queued for retry.");
            }
        },
        [invalidateProgressQueries, applyLevelEvent, userLoginId],
    );

    // Commit the graded results (optimistic cache update + background sync)
    // without navigating. Idempotent: safe to call once when the summary
    // appears and again when the learner leaves — the second call no-ops.
    const saveSession = useCallback(
        (payload: SessionCompletePayload) => {
            if (savedOnce || payload.wordResults.length === 0) {
                return;
            }
            setSavedOnce(true);
            setHasUnsavedPractice(false);

            applyOptimisticWordProgress(
                queryClient,
                wordIdList,
                progressByWordId,
                { answers: payload.wordResults },
            );

            fireCelebrationConfetti();

            // Keep a handle on the in-flight save so an exit can wait for it.
            // `persistSessionInBackground` swallows its own errors, so this
            // promise always resolves.
            const pending = persistSessionInBackground(payload).finally(() => {
                savePromiseRef.current = null;
            });
            savePromiseRef.current = pending;
        },
        [
            savedOnce,
            progressByWordId,
            queryClient,
            wordIdList,
            persistSessionInBackground,
        ],
    );

    const persistSession = useCallback(
        async (payload: SessionCompletePayload, destination?: string) => {
            const target =
                destination ??
                (courseId ? `/learn/courses/${courseId}` : "/learn");
            saveSession(payload);

            const pending = savePromiseRef.current;
            if (pending) {
                setIsExiting(true);
                try {
                    await Promise.race([
                        pending,
                        new Promise((resolve) =>
                            setTimeout(resolve, EXIT_SAVE_WAIT_MS),
                        ),
                    ]);
                } finally {
                    setIsExiting(false);
                }
            }

            router.replace(target);
        },
        [saveSession, courseId, router],
    );

    return {
        saveSession,
        persistSession,
        /** True only while leaving with a save still in flight — drives the overlay. */
        isPersisting: isExiting,
        /** Populated once a LIVE sync returns; null while offline/queued. */
        sessionSyncResult,
        /** True when the results are queued on the device awaiting a connection. */
        isSavedOffline,
    };
}
