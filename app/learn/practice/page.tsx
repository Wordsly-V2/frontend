"use client";

import LoadingSection from "@/components/common/loading-section/loading-section";
import { PracticeSessionLayout } from "@/components/features/vocabulary/practice-session-layout";
import { PracticeSessionOverview } from "@/components/features/vocabulary/practice-session-overview";
import VocabularyPractice from "@/components/features/vocabulary/vocabulary-practice";
import { Button } from "@/components/ui/button";
import { usePracticeSessionPersistence } from "@/hooks/usePracticeSessionPersistence.hook";
import { usePracticeSessionPlan } from "@/hooks/usePracticeSessionPlan.hook";
import { practiceSessionSearchParams } from "@/lib/practice-session";
import { useGetProgressByWordIdsQuery } from "@/queries/word-progress.query";
import { useGetWordsByIdsQuery } from "@/queries/words.query";
import type { PracticePhase } from "@/types/practice/practice.type";
import { ArrowLeft } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function PracticePage() {
    const router = useRouter();
    const [{ courseId, courseName, wordIds, kind }] = useQueryStates(
        practiceSessionSearchParams,
    );
    const [phase, setPhase] = useState<PracticePhase>("overview");

    const wordIdList = wordIds ?? [];
    const paramsValid = Boolean(courseName && courseId && wordIdList.length > 0);

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
    } = useGetWordsByIdsQuery(courseId ?? "", wordIdList, paramsValid);

    const {
        data: progressByWordId,
        isLoading: isProgressLoading,
        isError: isProgressError,
        refetch: refetchProgress,
    } = useGetProgressByWordIdsQuery(wordIdList, paramsValid);

    const { sessionKind, sessionPlan, leechWordIds, isReview } = usePracticeSessionPlan(
        words,
        progressByWordId,
        kind,
    );

    const { persistSession, isPersisting, markUnsaved } = usePracticeSessionPersistence({
        courseId: courseId ?? "",
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

    const overviewSubtitle = [
        courseName,
        `${words.length} word${words.length === 1 ? "" : "s"}`,
    ]
        .filter(Boolean)
        .join(" · ");

    const practiceSubtitle = isReview
        ? `${sessionPlan.practiceQueue.length} exercises · recall mode`
        : `${sessionPlan.practiceQueue.length} exercises`;

    return (
        <PracticeSessionLayout
            variant={phase === "practice" ? "practice" : "overview"}
            title={phase === "overview" ? "Session plan" : undefined}
            subtitle={phase === "overview" ? overviewSubtitle : practiceSubtitle}
            courseName={courseName ?? ""}
            onBack={handleBackToCourse}
            backDisabled={isPersisting}
            isPersisting={isPersisting}
        >
            {phase === "overview" && (
                <PracticeSessionOverview
                    counts={sessionPlan.counts}
                    totalWords={words.length}
                    exerciseCount={sessionPlan.practiceQueue.length}
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
