"use client";

import LoadingSection from "@/components/common/loading-section/loading-section";
import WordDetailsCarousel from "@/components/features/vocabulary/word-details-carousel";
import VocabularyPractice, {
    type SessionCompletePayload,
} from "@/components/features/vocabulary/vocabulary-practice";
import { Button } from "@/components/ui/button";
import { fireCelebrationConfetti } from "@/lib/confetti";
import { parsePracticeSessionKind } from "@/lib/practice-session";
import {
    useGetProgressByWordIdsQuery,
    useRecordAnswerBulkMutation,
} from "@/queries/word-progress.query";
import { useGetWordsByIdsQuery } from "@/queries/words.query";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const LEECH_MIN_REVIEWS = 3;
const LEECH_MAX_SUCCESS_RATE = 50;

function buildLeechWordIds(
    wordIds: string[],
    progress: Record<string, { totalReviews: number; successRate: number } | null> | undefined,
): Set<string> {
    const leeches = new Set<string>();
    if (!progress) return leeches;
    for (const id of wordIds) {
        const p = progress[id];
        if (p && p.totalReviews >= LEECH_MIN_REVIEWS && p.successRate < LEECH_MAX_SUCCESS_RATE) {
            leeches.add(id);
        }
    }
    return leeches;
}

export default function PracticePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionKind = parsePracticeSessionKind(searchParams.get("kind"));
    const isReview = sessionKind === "review";
    const [phase, setPhase] = useState<"intro" | "practice">(isReview ? "practice" : "intro");
    const [introIndex, setIntroIndex] = useState(0);
    const [savedOnce, setSavedOnce] = useState(false);

    const courseNameRaw = searchParams.get("courseName") ?? "";
    const courseId = searchParams.get("courseId") ?? "";
    const wordIdsParam = searchParams.get("wordIds") ?? "";
    const paramsValid = Boolean(courseNameRaw && courseId && wordIdsParam);
    const wordIdList = wordIdsParam ? wordIdsParam.split(",").filter(Boolean) : [];
    const courseName = (() => {
        try {
            return decodeURIComponent(courseNameRaw);
        } catch {
            return courseNameRaw;
        }
    })();

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

    const { data: progressByWordId } = useGetProgressByWordIdsQuery(
        wordIdList,
        paramsValid && wordIdList.length > 0,
    );

    const leechWordIds = useMemo(
        () => buildLeechWordIds(wordIdList, progressByWordId),
        [wordIdList, progressByWordId],
    );

    const { mutate: recordBulk, isPending: isSaving } = useRecordAnswerBulkMutation();

    const persistSession = useCallback(
        (payload: SessionCompletePayload) => {
            if (savedOnce || payload.wordResults.length === 0) {
                router.replace(`/learn/courses/${courseId}`);
                return;
            }
            setSavedOnce(true);
            recordBulk(
                { answers: payload.wordResults },
                {
                    onSuccess: () => {
                        fireCelebrationConfetti();
                        toast.success("Progress saved!");
                        router.replace(`/learn/courses/${courseId}`);
                    },
                    onError: () => {
                        setSavedOnce(false);
                        toast.error("Could not save progress. Try again.");
                    },
                },
            );
        },
        [savedOnce, recordBulk, courseId, router],
    );

    const handleBackToCourse = () => {
        router.push(`/learn/courses/${courseId}`);
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

    if (isWordsLoading || isWordsError) {
        return (
            <LoadingSection
                isLoading={isWordsLoading}
                error={isWordsError ? "Error loading words" : null}
                refetch={refetchWords}
            />
        );
    }

    if (!words || words.length === 0) {
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

    const title =
        phase === "intro"
            ? "New Words"
            : isReview
              ? "Review"
              : "Practice";

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
                    disabled={isSaving}
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
                        {isReview && " • due for review"}
                    </p>
                </div>
                <div className="flex-1 pb-4 flex flex-col min-h-0">
                    {phase === "intro" ? (
                        <>
                            <section className="flex-1 flex flex-col min-h-0">
                                <WordDetailsCarousel
                                    words={words}
                                    onIndexChange={setIntroIndex}
                                    headerSlot={
                                        <span className="text-sm font-medium tabular-nums text-muted-foreground">
                                            {introIndex + 1} / {words.length}
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
                    ) : (
                        <VocabularyPractice
                            words={words}
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
