"use client";

import LoadingSection from "@/components/common/loading-section/loading-section";
import { SavingOverlay } from "@/components/common/saving-overlay";
import { PracticeSessionOverview } from "@/components/features/vocabulary/practice-session-overview";
import VocabularyPractice, {
    type SessionCompletePayload,
} from "@/components/features/vocabulary/vocabulary-practice";
import { Button } from "@/components/ui/button";
import { fireCelebrationConfetti } from "@/lib/confetti";
import { applyOptimisticWordProgress } from "@/lib/optimistic-word-progress";
import {
    enqueuePendingPracticeSave,
    getPendingPracticeSaves,
    removePendingPracticeSave,
} from "@/lib/practice-pending-saves";
import { parsePracticeSessionKind } from "@/lib/practice-session";
import { waitForWordProgressSync } from "@/lib/wait-for-word-progress-sync";
import {
    buildLeechWordIds,
    buildPracticeSessionPlan,
    inferPracticeSessionKind,
} from "@/lib/word-progress-stage";
import {
    recordAnswerBulk,
    recordAnswerBulkSync,
} from "@/apis/word-progress.api";
import {
    useGetProgressByWordIdsQuery,
} from "@/queries/word-progress.query";
import { useGetWordsByIdsQuery } from "@/queries/words.query";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type PracticePhase = "overview" | "practice";

async function saveSessionResults(
    payload: SessionCompletePayload,
    progressBeforeSave: Record<string, import("@/types/word-progress/word-progress.type").IWordProgressResponse | null> | undefined,
): Promise<"sync" | "async" | "queued"> {
    try {
        await recordAnswerBulkSync({ answers: payload.wordResults });
        return "sync";
    } catch {
        try {
            await recordAnswerBulk({ answers: payload.wordResults });
            const wordIds = [...new Set(payload.wordResults.map((r) => r.wordId))];
            await waitForWordProgressSync(wordIds, progressBeforeSave);
            return "async";
        } catch {
            enqueuePendingPracticeSave({ answers: payload.wordResults });
            return "queued";
        }
    }
}

export default function PracticePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const urlSessionKind = parsePracticeSessionKind(searchParams.get("kind"));
    const [phase, setPhase] = useState<PracticePhase>("overview");
    const [savedOnce, setSavedOnce] = useState(false);
    const [isSyncingProgress, setIsSyncingProgress] = useState(false);
    const [hasUnsavedPractice, setHasUnsavedPractice] = useState(false);

    const courseNameRaw = searchParams.get("courseName") ?? "";
    const courseId = searchParams.get("courseId") ?? "";
    const wordIdsParam = searchParams.get("wordIds") ?? "";
    const paramsValid = Boolean(courseNameRaw && courseId && wordIdsParam);

    const wordIdList = useMemo(
        () => (wordIdsParam ? wordIdsParam.split(",").filter(Boolean) : []),
        [wordIdsParam],
    );

    const courseName = useMemo(() => {
        try {
            return decodeURIComponent(courseNameRaw);
        } catch {
            return courseNameRaw;
        }
    }, [courseNameRaw]);

    useEffect(() => {
        if (!paramsValid) {
            router.replace("/learn");
        }
    }, [paramsValid, router]);

    const {
        data: words,
        isLoading: isWordsLoading,
        isError: isWordsError,
        refetch: refetchWords,
    } = useGetWordsByIdsQuery(courseId, wordIdList, paramsValid && wordIdList.length > 0);

    const {
        data: progressByWordId,
        isLoading: isProgressLoading,
        isError: isProgressError,
        refetch: refetchProgress,
    } = useGetProgressByWordIdsQuery(wordIdList, paramsValid && wordIdList.length > 0);

    const sessionKind = useMemo(() => {
        if (!words?.length) return urlSessionKind;
        const stages = buildPracticeSessionPlan(words, progressByWordId, urlSessionKind);
        return inferPracticeSessionKind(stages.counts, urlSessionKind);
    }, [words, progressByWordId, urlSessionKind]);

    const isReview = sessionKind === "review";

    const sessionPlan = useMemo(() => {
        if (!words?.length) return null;
        return buildPracticeSessionPlan(words, progressByWordId, sessionKind);
    }, [words, progressByWordId, sessionKind]);

    const leechWordIds = useMemo(
        () => buildLeechWordIds(progressByWordId),
        [progressByWordId],
    );

    const isPersisting = isSyncingProgress;

    const invalidateProgressQueries = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ["word-progress"] });
        await queryClient.invalidateQueries({ queryKey: ["due-words"] });
        await queryClient.invalidateQueries({ queryKey: ["due-word-ids"] });
    }, [queryClient]);

    const flushPendingSaves = useCallback(async () => {
        const pending = getPendingPracticeSaves();
        for (const item of pending) {
            try {
                await recordAnswerBulkSync(item.payload);
                removePendingPracticeSave(item.id);
            } catch {
                try {
                    await recordAnswerBulk(item.payload);
                    removePendingPracticeSave(item.id);
                } catch {
                    break;
                }
            }
        }
    }, []);

    useEffect(() => {
        void flushPendingSaves();
    }, [flushPendingSaves]);

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

    const handlePracticeComplete = useCallback(
        (payload: SessionCompletePayload) => {
            void persistSession(payload);
        },
        [persistSession],
    );

    const handleBackToCourse = () => {
        router.push(`/learn/courses/${courseId}`);
    };

    const handleOverviewStart = () => {
        setPhase("practice");
    };

    if (!paramsValid) {
        return (
            <main className="flex min-h-dvh items-center justify-center px-4">
                <p className="text-sm text-muted-foreground">Taking you to Learn…</p>
            </main>
        );
    }

    const isLoading = isWordsLoading || isProgressLoading;
    const isError = isWordsError || isProgressError;

    if (isLoading || isError) {
        return (
            <LoadingSection
                isLoading={isLoading}
                error={isError ? "Error loading session" : null}
                refetch={() => {
                    refetchWords();
                    refetchProgress();
                }}
            />
        );
    }

    if (!words || words.length === 0 || !sessionPlan) {
        return (
            <main className="min-h-dvh bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">No words selected</h2>
                    <Button onClick={handleBackToCourse}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Course
                    </Button>
                </div>
            </main>
        );
    }

    let title = "Practice";
    if (phase === "overview") title = "Session plan";
    else if (isReview) title = "Review";

    return (
        <main className="bg-background flex flex-col">
            <SavingOverlay open={isPersisting} />
            <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6 max-w-4xl flex flex-col">
                <Button
                    variant="ghost"
                    onClick={handleBackToCourse}
                    className="mb-3 sm:mb-4 self-start flex-shrink-0 text-muted-foreground hover:text-foreground"
                    size="sm"
                    disabled={isPersisting}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Course
                </Button>
                <div className="text-center mb-4 sm:mb-6 flex-shrink-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 tracking-tight">
                        {title}
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        {courseName} • {words.length} word{words.length === 1 ? "" : "s"}
                        {isReview && phase === "practice" && " • recall mode"}
                    </p>
                </div>
                <div className="flex-1 pb-4 flex flex-col min-h-0">
                    {phase === "overview" && (
                        <PracticeSessionOverview
                            counts={sessionPlan.counts}
                            totalWords={words.length}
                            hasIntro={sessionPlan.introWords.length > 0}
                            isReviewSession={isReview}
                            onStart={handleOverviewStart}
                        />
                    )}
                    {phase === "practice" && (
                        <VocabularyPractice
                            words={words}
                            practiceQueue={sessionPlan.practiceQueue}
                            stagesByWordId={sessionPlan.stagesByWordId}
                            sessionKind={sessionKind}
                            leechWordIds={leechWordIds}
                            onSummaryReady={() => setHasUnsavedPractice(true)}
                            onComplete={handlePracticeComplete}
                        />
                    )}
                </div>
            </div>
        </main>
    );
}
