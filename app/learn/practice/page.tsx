"use client";

import LoadingSection from "@/components/common/loading-section/loading-section";
import { PracticeSessionOverview } from "@/components/features/vocabulary/practice-session-overview";
import WordDetailsCarousel from "@/components/features/vocabulary/word-details-carousel";
import VocabularyPractice, {
    type SessionCompletePayload,
} from "@/components/features/vocabulary/vocabulary-practice";
import { Button } from "@/components/ui/button";
import { fireCelebrationConfetti } from "@/lib/confetti";
import { parsePracticeSessionKind } from "@/lib/practice-session";
import { waitForWordProgressSync } from "@/lib/wait-for-word-progress-sync";
import {
    buildLeechWordIds,
    buildPracticeSessionPlan,
} from "@/lib/word-progress-stage";
import {
    useGetProgressByWordIdsQuery,
    useRecordAnswerBulkMutation,
} from "@/queries/word-progress.query";
import { useGetWordsByIdsQuery } from "@/queries/words.query";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type PracticePhase = "overview" | "intro" | "practice";

export default function PracticePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const sessionKind = parsePracticeSessionKind(searchParams.get("kind"));
    const isReview = sessionKind === "review";
    const [phase, setPhase] = useState<PracticePhase>("overview");
    const [introIndex, setIntroIndex] = useState(0);
    const [savedOnce, setSavedOnce] = useState(false);
    const [isSyncingProgress, setIsSyncingProgress] = useState(false);

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

    const sessionPlan = useMemo(() => {
        if (!words?.length) return null;
        return buildPracticeSessionPlan(words, progressByWordId, sessionKind);
    }, [words, progressByWordId, sessionKind]);

    const leechWordIds = useMemo(
        () => buildLeechWordIds(progressByWordId),
        [progressByWordId],
    );

    const { mutate: recordBulk, isPending: isSaving } = useRecordAnswerBulkMutation();
    const isPersisting = isSaving || isSyncingProgress;

    const invalidateProgressQueries = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ["word-progress"] });
        await queryClient.invalidateQueries({ queryKey: ["due-words"] });
        await queryClient.invalidateQueries({ queryKey: ["due-word-ids"] });
    }, [queryClient]);

    const persistSession = useCallback(
        (payload: SessionCompletePayload) => {
            if (savedOnce || payload.wordResults.length === 0) {
                router.replace(`/learn/courses/${courseId}`);
                return;
            }
            setSavedOnce(true);
            const wordIds = [...new Set(payload.wordResults.map((r) => r.wordId))];
            const progressBeforeSave = progressByWordId;

            recordBulk(
                { answers: payload.wordResults },
                {
                    onSuccess: async () => {
                        setIsSyncingProgress(true);
                        try {
                            const synced = await waitForWordProgressSync(
                                wordIds,
                                progressBeforeSave,
                            );
                            await invalidateProgressQueries();
                            fireCelebrationConfetti();
                            toast.success("Progress saved!");
                            if (!synced) {
                                toast.info("Stats may take a moment to fully update.");
                            }
                            router.replace(`/learn/courses/${courseId}`);
                        } catch {
                            setSavedOnce(false);
                            toast.error("Could not confirm progress sync.");
                        } finally {
                            setIsSyncingProgress(false);
                        }
                    },
                    onError: () => {
                        setSavedOnce(false);
                        toast.error("Could not save progress. Try again.");
                    },
                },
            );
        },
        [
            savedOnce,
            recordBulk,
            courseId,
            router,
            progressByWordId,
            invalidateProgressQueries,
        ],
    );

    const handleBackToCourse = () => {
        router.push(`/learn/courses/${courseId}`);
    };

    const handleOverviewStart = () => {
        if (sessionPlan && sessionPlan.introWords.length > 0) {
            setPhase("intro");
        } else {
            setPhase("practice");
        }
    };

    useEffect(() => {
        if (phase !== "intro") return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter") setPhase("practice");
        };
        globalThis.addEventListener("keydown", onKeyDown);
        return () => globalThis.removeEventListener("keydown", onKeyDown);
    }, [phase]);

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
    else if (phase === "intro") title = "New words";
    else if (isReview) title = "Review";

    return (
        <main
            className={
                phase === "intro"
                    ? "bg-gradient-to-b from-background via-background to-muted/30"
                    : "bg-background flex flex-col"
            }
        >
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
                        {isReview && phase === "practice" && " • due for review"}
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
                    {phase === "intro" && (
                        <>
                            <section className="flex-1 flex flex-col min-h-0">
                                <WordDetailsCarousel
                                    words={sessionPlan.introWords}
                                    onIndexChange={setIntroIndex}
                                    headerSlot={
                                        <span className="text-sm font-medium tabular-nums text-muted-foreground">
                                            {introIndex + 1} / {sessionPlan.introWords.length}
                                        </span>
                                    }
                                    className="flex-1"
                                />
                            </section>
                            <div className="flex-shrink-0 pt-4 sm:pt-6 flex justify-center">
                                <Button size="lg" onClick={() => setPhase("practice")}>
                                    Start practice
                                </Button>
                            </div>
                        </>
                    )}
                    {phase === "practice" && (
                        <VocabularyPractice
                            words={words}
                            practiceQueue={sessionPlan.practiceQueue}
                            stagesByWordId={sessionPlan.stagesByWordId}
                            sessionKind={sessionKind}
                            leechWordIds={leechWordIds}
                            onComplete={persistSession}
                        />
                    )}
                </div>
            </div>
        </main>
    );
}
