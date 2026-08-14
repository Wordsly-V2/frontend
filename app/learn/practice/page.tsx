"use client";

import LoadingSection from "@/components/common/loading-section/loading-section";
import { SavingOverlay } from "@/components/common/saving-overlay";
import { PracticeSessionLayout } from "@/components/features/vocabulary/practice-session-layout";
import { PracticeSessionOverview } from "@/components/features/vocabulary/practice-session-overview";
import VocabularyPractice from "@/components/features/vocabulary/vocabulary-practice";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/useOnlineStatus.hook";
import { usePracticeSessionPersistence } from "@/hooks/usePracticeSessionPersistence.hook";
import { usePracticeSessionPlan } from "@/hooks/usePracticeSessionPlan.hook";
import { resolveProgress } from "@/lib/offline/progress-cache";
import { practiceSessionSearchParams } from "@/lib/practice-session";
import { useGetProgressByWordIdsQuery } from "@/queries/word-progress.query";
import { useGetWordsByIdsQuery } from "@/queries/words.query";
import type { PracticePhase } from "@/types/practice/practice.type";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function PracticePage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const isOffline = useOnlineStatus() === "offline";
    const [{ courseId, courseName, wordIds, kind }] = useQueryStates(
        practiceSessionSearchParams,
    );
    const [phase, setPhase] = useState<PracticePhase>("overview");

    // Memoized because it feeds a useMemo dependency list below; a fresh array
    // each render would re-run the cache scan on every keystroke.
    const wordIdList = useMemo(() => wordIds ?? [], [wordIds]);
    // courseId is optional: an all-courses review/learn session carries only
    // word IDs (no single course). Words are then hydrated across all courses.
    const paramsValid = wordIdList.length > 0;

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
    } = useGetWordsByIdsQuery(courseId ?? undefined, wordIdList, paramsValid);

    const {
        data: serverProgress,
        refetch: refetchProgress,
    } = useGetProgressByWordIdsQuery(wordIdList, paramsValid);

    // Progress must never gate the session — but a word whose progress is
    // missing is classified as new, which would give a due review word three
    // intro rounds and the wrong hint policy. So fall back to whatever the
    // cache holds (the course page caches it under a different key).
    const { progressByWordId, source: progressSource } = useMemo(
        () => resolveProgress(queryClient, wordIdList, serverProgress),
        [queryClient, serverProgress, wordIdList],
    );

    const { sessionKind, sessionPlan, leechWordIds, isReview } = usePracticeSessionPlan(
        words,
        progressByWordId,
        kind,
    );

    const {
        saveSession,
        persistSession,
        isPersisting,
        sessionSyncResult,
        isSavedOffline,
    } =
        usePracticeSessionPersistence({
            courseId: courseId ?? "",
            wordIdList,
            progressByWordId,
        });

    const handleBackToCourse = useCallback(() => {
        router.push(courseId ? `/learn/courses/${courseId}` : "/learn");
    }, [router, courseId]);

    const handlePracticeComplete = useCallback(
        (
            payload: Parameters<typeof persistSession>[0],
            destination?: string,
        ) => {
            void persistSession(payload, destination);
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

    // Gate on whether we HAVE the words, not on whether the last fetch
    // succeeded. Offline, a query with restored cache data reports isError
    // alongside perfectly usable data — gating on the error meant a downloaded
    // session showed a permanent error screen.
    if (!words && isWordsLoading) {
        return (
            <LoadingSection
                isLoading
                error={null}
                refetch={() => {
                    refetchWords();
                    refetchProgress();
                }}
            />
        );
    }

    if (!words) {
        return (
            <LoadingSection
                isLoading={false}
                error={
                    isOffline || !isWordsError ? null : "Error loading session"
                }
                isDataNotFound={isOffline}
                dataNotFoundLabel="This session isn't downloaded yet. Reconnect once to load these words."
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

    if (phase === "practice") {
        // Immersive "focus mode": ambient mesh backdrop, floating glass
        // session header (rendered inside VocabularyPractice) — no app chrome.
        return (
            <main className="mesh-page-bg flex min-h-dvh flex-col">
                <SavingOverlay open={isPersisting} />
                <div className="container mx-auto flex w-full max-w-3xl flex-1 flex-col px-3 pt-2 pb-6 pb-safe sm:px-4 sm:pt-3">
                    <VocabularyPractice
                        words={words}
                        practiceQueue={sessionPlan.practiceQueue}
                        stagesByWordId={sessionPlan.stagesByWordId}
                        sessionKind={sessionKind}
                        leechWordIds={leechWordIds}
                        courseName={courseName ?? "Practice"}
                        sessionSubtitle={practiceSubtitle}
                        onExit={handleBackToCourse}
                        exitDisabled={isPersisting}
                        onSubmitResults={saveSession}
                        onComplete={handlePracticeComplete}
                        levelEvent={sessionSyncResult?.levelEvent}
                        xpMultiplier={sessionSyncResult?.xpMultiplier}
                        isSavedOffline={isSavedOffline}
                    />
                </div>
            </main>
        );
    }

    return (
        <PracticeSessionLayout
            variant="overview"
            title="Session plan"
            subtitle={overviewSubtitle}
            courseName={courseName ?? ""}
            onBack={handleBackToCourse}
            backDisabled={isPersisting}
            isPersisting={isPersisting}
        >
            <PracticeSessionOverview
                counts={sessionPlan.counts}
                totalWords={words.length}
                exerciseCount={sessionPlan.practiceQueue.length}
                newWordCount={sessionPlan.introWords.length}
                isReviewSession={isReview}
                isOfflineCopy={progressSource === "cache"}
                onStart={() => setPhase("practice")}
            />
        </PracticeSessionLayout>
    );
}
