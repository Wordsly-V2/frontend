"use client";

import { ContinueCourseButton } from "@/components/common/continue-course-button";
import { Button } from "@/components/ui/button";
import {
    dailyGoalProgress,
    getLocalDailyHabit,
} from "@/lib/daily-habit";
import { buildPracticeUrl } from "@/lib/practice-session";
import {
    deriveNewWordIds,
    getLearnNewButtonLabel,
    getReviewDueButtonLabel,
    readDueWordsLimitFromStorage,
} from "@/lib/due-words-limit";
import { getLastLearnCourse } from "@/lib/learning-session";
import { useDailyHabitDisplay } from "@/queries/daily-habit.query";
import { useGetDueWordIdsQuery } from "@/queries/word-progress.query";
import { Brain, Library, Sparkles, Target } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

export function LearnQuickActions() {
    const router = useRouter();
    const pathname = usePathname();
    const [last, setLast] = useState<ReturnType<typeof getLastLearnCourse>>(null);
    const [dueWordsLimit, setDueWordsLimit] = useState(readDueWordsLimitFromStorage);
    const { habit: serverHabit } = useDailyHabitDisplay();
    const habit = serverHabit ?? getLocalDailyHabit();
    const goal = dailyGoalProgress(habit.wordsToday, habit.goal);

    useEffect(() => {
        startTransition(() => {
            setLast(getLastLearnCourse());
            setDueWordsLimit(readDueWordsLimitFromStorage());
        });
    }, [pathname]);

    const { data: dueIds, isLoading: dueLoading } = useGetDueWordIdsQuery(
        last?.id,
        undefined,
        dueWordsLimit,
        false,
        !!last?.id && dueWordsLimit > 0,
    );

    const { data: practiceBatch, isLoading: practiceBatchLoading } = useGetDueWordIdsQuery(
        last?.id,
        undefined,
        dueWordsLimit,
        true,
        !!last?.id && dueWordsLimit > 0,
    );

    const dueCount = dueIds?.wordIds.length ?? 0;
    const newWordIds = useMemo(
        () => deriveNewWordIds(dueIds?.wordIds, practiceBatch?.wordIds),
        [dueIds?.wordIds, practiceBatch?.wordIds],
    );
    const newCount = newWordIds.length;
    const practicePoolCount = practiceBatch?.wordIds.length ?? 0;
    const wordsLoading = dueLoading || practiceBatchLoading;

    const handleReviewDue = () => {
        if (!last || dueCount === 0) return;
        router.push(
            buildPracticeUrl({
                courseId: last.id,
                courseName: last.name,
                wordIds: dueIds!.wordIds,
                kind: "review",
            }),
        );
    };

    const handleLearnNew = () => {
        if (!last || newCount === 0) return;
        router.push(
            buildPracticeUrl({
                courseId: last.id,
                courseName: last.name,
                wordIds: newWordIds,
                kind: "new",
            }),
        );
    };

    const handleFinishDailyGoal = () => {
        if (!last || practicePoolCount === 0 || goal.met) return;
        const wordsNeeded = Math.min(goal.remaining, practicePoolCount);
        const wordIds = practiceBatch!.wordIds.slice(0, wordsNeeded);
        const onlyDueWords = dueCount > 0 && newCount === 0;
        router.push(
            buildPracticeUrl({
                courseId: last.id,
                courseName: last.name,
                wordIds,
                kind: onlyDueWords ? "review" : "new",
            }),
        );
    };

    const subtitle = goal.met
        ? habit.goalStreak > 0
            ? `${habit.goalStreak}-day goal streak — quick review keeps momentum.`
            : "Daily goal done — keep your streak alive with a quick review."
        : goal.remaining <= 3 && habit.wordsToday > 0
          ? `Almost there — ${goal.remaining} more word${goal.remaining === 1 ? "" : "s"} today.`
          : "Continue where you left off — or jump into review.";

    return (
        <nav
            aria-label="Quick learning actions"
            className="mb-6 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm sm:p-5"
        >
            <div className="flex min-w-0 flex-col gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Next step
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                </div>

                <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                    {last ? (
                        <>
                            {!goal.met && practicePoolCount > 0 && (
                                <Button
                                    type="button"
                                    variant="default"
                                    className="w-full rounded-xl gap-2 sm:w-auto"
                                    disabled={wordsLoading}
                                    onClick={handleFinishDailyGoal}
                                >
                                    <Target className="h-4 w-4" aria-hidden />
                                    {wordsLoading
                                        ? "Loading…"
                                        : `Finish today's goal (${Math.min(goal.remaining, practicePoolCount)} words)`}
                                </Button>
                            )}
                            <ContinueCourseButton
                                courseId={last.id}
                                courseName={last.name}
                                className="min-w-0 max-w-full justify-between gap-2 sm:max-w-[min(100%,20rem)]"
                            />
                            {dueCount > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full rounded-xl gap-2 border-primary/25 sm:w-auto"
                                    disabled={wordsLoading}
                                    onClick={handleReviewDue}
                                >
                                    <Brain className="h-4 w-4" aria-hidden />
                                    {getReviewDueButtonLabel(wordsLoading, dueCount)}
                                </Button>
                            )}
                            {newCount > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full rounded-xl gap-2 border-primary/25 sm:w-auto"
                                    disabled={wordsLoading}
                                    onClick={handleLearnNew}
                                >
                                    <Sparkles className="h-4 w-4" aria-hidden />
                                    {getLearnNewButtonLabel(wordsLoading, newCount)}
                                </Button>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground py-2">
                            Open any course below to start — we&apos;ll remember it for next time.
                        </p>
                    )}
                    <Button variant="secondary" className="w-full rounded-xl gap-2 sm:w-auto" asChild>
                        <a href="#course-library">
                            <Library className="h-4 w-4" aria-hidden />
                            Browse courses
                        </a>
                    </Button>
                </div>
            </div>
        </nav>
    );
}
