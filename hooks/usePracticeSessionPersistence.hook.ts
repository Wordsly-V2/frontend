import { applyOptimisticWordProgress } from "@/lib/optimistic-word-progress";
import { enqueuePendingPracticeSave } from "@/lib/practice-pending-saves";
import {
    flushPendingPracticeSaves,
    saveSessionResults,
} from "@/lib/practice-session-persistence";
import { fireCelebrationConfetti } from "@/lib/confetti";
import { getUserLevel } from "@/apis/user-level.api";
import { userLevelQueryKey } from "@/queries/user-level.query";
import type { SessionCompletePayload } from "@/types/practice/practice.type";
import type { IUserLevel } from "@/types/user-level/user-level.type";
import type { IWordProgressResponse } from "@/types/word-progress/word-progress.type";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
    const [savedOnce, setSavedOnce] = useState(false);
    const [hasUnsavedPractice, setHasUnsavedPractice] = useState(false);

    const invalidateProgressQueries = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ["word-progress"] });
        await queryClient.invalidateQueries({ queryKey: ["due-words"] });
        await queryClient.invalidateQueries({ queryKey: ["due-word-ids"] });
    }, [queryClient]);

    useEffect(() => {
        void flushPendingPracticeSaves();
    }, []);

    useEffect(() => {
        if (!hasUnsavedPractice) return;
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };
        globalThis.addEventListener("beforeunload", onBeforeUnload);
        return () => globalThis.removeEventListener("beforeunload", onBeforeUnload);
    }, [hasUnsavedPractice]);

    // Re-fetch the level after a session and celebrate if it crossed a boundary.
    // Non-critical: any failure is swallowed so it never blocks the save flow.
    const refreshLevelAndCelebrate = useCallback(async () => {
        const previous = queryClient.getQueryData<IUserLevel>(
            userLevelQueryKey(),
        );
        try {
            const next = await getUserLevel();
            queryClient.setQueryData(userLevelQueryKey(), next);
            if (previous && next.level > previous.level) {
                fireCelebrationConfetti();
                toast.success(
                    `Level up! You reached level ${next.level} — ${next.rank} 🎉`,
                    { duration: 5000 },
                );
            }
        } catch {
            // Ignore — leveling is a non-blocking enhancement.
        }
    }, [queryClient]);

    const persistSessionInBackground = useCallback(
        async (payload: SessionCompletePayload) => {
            try {
                const outcome = await saveSessionResults(payload);
                await invalidateProgressQueries();

                if (outcome === "queued") {
                    toast.warning("Saved locally — we will sync when you are back online.");
                } else {
                    await refreshLevelAndCelebrate();
                }
            } catch {
                setHasUnsavedPractice(true);
                enqueuePendingPracticeSave({ answers: payload.wordResults });
                toast.error("Could not save progress. It is queued for retry.");
            }
        },
        [invalidateProgressQueries, refreshLevelAndCelebrate],
    );

    const persistSession = useCallback(
        (payload: SessionCompletePayload, destination?: string) => {
            const target = destination ?? `/learn/courses/${courseId}`;
            if (savedOnce || payload.wordResults.length === 0) {
                router.replace(target);
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
            router.replace(target);

            void persistSessionInBackground(payload);
        },
        [
            savedOnce,
            courseId,
            router,
            progressByWordId,
            queryClient,
            wordIdList,
            persistSessionInBackground,
        ],
    );

    return {
        persistSession,
        isPersisting: false,
        markUnsaved: () => setHasUnsavedPractice(true),
    };
}
