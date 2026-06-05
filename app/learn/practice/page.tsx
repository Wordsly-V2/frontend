"use client";

import LoadingSection from "@/components/common/loading-section/loading-section";
import { PracticeSessionLayout } from "@/components/features/vocabulary/practice-session-layout";
import { PracticeSessionOverview } from "@/components/features/vocabulary/practice-session-overview";
import VocabularyPractice from "@/components/features/vocabulary/vocabulary-practice";
import { Button } from "@/components/ui/button";
import { usePracticeSessionPersistence } from "@/hooks/usePracticeSessionPersistence.hook";
import { usePracticeSessionPlan } from "@/hooks/usePracticeSessionPlan.hook";
import { parsePracticeSessionKind } from "@/lib/practice-session";
import { useGetProgressByWordIdsQuery } from "@/queries/word-progress.query";
import { useGetWordsByIdsQuery } from "@/queries/words.query";
import type { PracticePhase } from "@/types/practice/practice.type";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

function decodeCourseName(raw: string): string {
    try {
        return decodeURIComponent(raw);
    } catch {
        return raw;
    }
}

export default function PracticePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlSessionKind = parsePracticeSessionKind(searchParams.get("kind"));
    const [phase, setPhase] = useState<PracticePhase>("overview");

    const courseNameRaw = searchParams.get("courseName") ?? "";
    const courseId = searchParams.get("courseId") ?? "";
    const wordIdsParam = searchParams.get("wordIds") ?? "";
    const paramsValid = Boolean(courseNameRaw && courseId && wordIdsParam);

    const wordIdList = useMemo(
        () => (wordIdsParam ? wordIdsParam.split(",").filter(Boolean) : []),
        [wordIdsParam],
    );

    const courseName = useMemo(() => decodeCourseName(courseNameRaw), [courseNameRaw]);

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

    const { sessionKind, sessionPlan, leechWordIds, isReview } = usePracticeSessionPlan(
        words,
        progressByWordId,
        urlSessionKind,
    );

    const { persistSession, isPersisting, markUnsaved } = usePracticeSessionPersistence({
        courseId,
        wordIdList,
        progressByWordId,
    });

    const handleBackToCourse = useCallback(() => {
        router.push(`/learn/courses/${courseId}`);
    }, [router, courseId]);

    const handlePracticeComplete = useCallback(
        (payload: Parameters<typeof persistSession>[0]) => {
            void persistSession(payload);
        },
        [persistSession],
    );

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

    if (!words?.length || !sessionPlan) {
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

    const subtitle = [
        courseName,
        `${words.length} word${words.length === 1 ? "" : "s"}`,
        isReview && phase === "practice" ? "recall mode" : null,
    ]
        .filter(Boolean)
        .join(" • ");

    return (
        <PracticeSessionLayout
            title={title}
            subtitle={subtitle}
            onBack={handleBackToCourse}
            backDisabled={isPersisting}
            isPersisting={isPersisting}
        >
            {phase === "overview" && (
                <PracticeSessionOverview
                    counts={sessionPlan.counts}
                    totalWords={words.length}
                    newWordCount={sessionPlan.introWords.length}
                    isReviewSession={isReview}
                    onStart={() => setPhase("practice")}
                />
            )}
            {phase === "practice" && (
                <VocabularyPractice
                    words={words}
                    practiceQueue={sessionPlan.practiceQueue}
                    stagesByWordId={sessionPlan.stagesByWordId}
                    sessionKind={sessionKind}
                    leechWordIds={leechWordIds}
                    onSummaryReady={markUnsaved}
                    onComplete={handlePracticeComplete}
                />
            )}
        </PracticeSessionLayout>
    );
}
