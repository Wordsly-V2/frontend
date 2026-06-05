import { applyOptimisticWordProgress } from "@/lib/optimistic-word-progress";
import { enqueuePendingPracticeSave } from "@/lib/practice-pending-saves";
import {
    flushPendingPracticeSaves,
    saveSessionResults,
} from "@/lib/practice-session-persistence";
import { fireCelebrationConfetti } from "@/lib/confetti";
import type { SessionCompletePayload } from "@/types/practice/practice.type";
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
    const [isSyncingProgress, setIsSyncingProgress] = useState(false);
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

    const persistSession = useCallback(
        async (payload: SessionCompletePayload) => {
            if (savedOnce || payload.wordResults.length === 0) {
                router.replace(`/learn/courses/${courseId}`);
                return;
            }
            setSavedOnce(true);
            setHasUnsavedPractice(false);
            setIsSyncingProgress(true);

            applyOptimisticWordProgress(
                queryClient,
                wordIdList,
                progressByWordId,
                { answers: payload.wordResults },
            );

            try {
                const outcome = await saveSessionResults(payload, progressByWordId);
                await invalidateProgressQueries();
                fireCelebrationConfetti();

                if (outcome === "queued") {
                    toast.warning("Saved locally — we will sync when you are back online.");
                } else if (outcome === "async") {
                    toast.success("Progress saved!");
                    toast.info("Stats may take a moment to fully update.");
                } else {
                    toast.success("Progress saved!");
                }

                router.replace(`/learn/courses/${courseId}`);
            } catch {
                setSavedOnce(false);
                setHasUnsavedPractice(true);
                enqueuePendingPracticeSave({ answers: payload.wordResults });
                toast.error("Could not save progress. It is queued for retry.");
            } finally {
                setIsSyncingProgress(false);
            }
        },
        [
            savedOnce,
            courseId,
            router,
            progressByWordId,
            invalidateProgressQueries,
            queryClient,
            wordIdList,
        ],
    );

    return {
        persistSession,
        isPersisting: isSyncingProgress,
        markUnsaved: () => setHasUnsavedPractice(true),
    };
}
