"use client";

import {
    dailyGoalProgress,
    getLocalDailyHabit,
} from "@/lib/daily-habit";
import {
    deriveNewWordIds,
    readDueWordsLimitFromStorage,
} from "@/lib/due-words-limit";
import { getLastLearnCourse } from "@/lib/learning-session";
import { buildPracticeUrl } from "@/lib/practice-session";
import { useDailyHabitDisplay } from "@/queries/daily-habit.query";
import { useGetDueWordIdsQuery } from "@/queries/word-progress.query";
import { usePathname } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

export type NextPracticeAction = {
    /** Last opened course, or null if the learner hasn't started one. */
    last: ReturnType<typeof getLastLearnCourse>;
    dueCount: number;
    newCount: number;
    /** Total words available in the next practice batch (due + new, capped). */
    practicePoolCount: number;
    wordsLoading: boolean;
    /** Daily-goal progress (met, remaining, percent). */
    goal: ReturnType<typeof dailyGoalProgress>;
    /** True when there is nothing due and nothing new to learn. */
    allCaughtUp: boolean;
    /** Primary CTA: the single best next session, or null if none available. */
    primary: {
        label: string;
        href: string;
        kind: "new" | "review";
    } | null;
    reviewDueHref: string | null;
    learnNewHref: string | null;
    /** Href that finishes today's goal with the minimum words needed. */
    finishGoalHref: string | null;
    finishGoalWords: number;
};

/**
 * Single source of truth for "what should the learner practice next".
 * Shared by the dashboard hero, the mobile bottom-bar Practice CTA, and the
 * session-summary loop-back. Mirrors the resolution that lived inline in
 * LearnQuickActions.
 */
export function useNextPracticeAction(): NextPracticeAction {
    const pathname = usePathname();
    const [last, setLast] =
        useState<ReturnType<typeof getLastLearnCourse>>(null);
    const [dueWordsLimit, setDueWordsLimit] = useState(
        readDueWordsLimitFromStorage,
    );
    const { habit: serverHabit } = useDailyHabitDisplay();
    const habit = serverHabit ?? getLocalDailyHabit();
    const goal = dailyGoalProgress(habit.wordsToday, habit.goal);

    useEffect(() => {
        startTransition(() => {
            setLast(getLastLearnCourse());
            setDueWordsLimit(readDueWordsLimitFromStorage());
        });
    }, [pathname]);

    // Practice suggestions span ALL of the user's courses, not just the last
    // one opened — a review is a review no matter which course a word lives in.
    // Passing no courseId makes the gateway scope to every word the user owns.
    const enabled = dueWordsLimit > 0;

    const { data: dueIds, isLoading: dueLoading } = useGetDueWordIdsQuery(
        { limit: dueWordsLimit, includeNew: false },
        enabled,
    );

    const { data: practiceBatch, isLoading: practiceBatchLoading } =
        useGetDueWordIdsQuery(
            { limit: dueWordsLimit, includeNew: true },
            enabled,
        );

    const dueCount = dueIds?.wordIds.length ?? 0;
    const newWordIds = useMemo(
        () => deriveNewWordIds(dueIds?.wordIds, practiceBatch?.wordIds),
        [dueIds?.wordIds, practiceBatch?.wordIds],
    );
    const newCount = newWordIds.length;
    const practicePoolCount = practiceBatch?.wordIds.length ?? 0;
    const wordsLoading = dueLoading || practiceBatchLoading;

    const reviewDueHref =
        dueCount > 0
            ? buildPracticeUrl({
                  courseName: "Review",
                  wordIds: dueIds!.wordIds,
                  kind: "review",
              })
            : null;

    const learnNewHref =
        newCount > 0
            ? buildPracticeUrl({
                  courseName: "New words",
                  wordIds: newWordIds,
                  kind: "new",
              })
            : null;

    const finishGoalWords =
        !goal.met && practicePoolCount > 0
            ? Math.min(goal.remaining, practicePoolCount)
            : 0;
    const finishGoalHref =
        finishGoalWords > 0
            ? buildPracticeUrl({
                  courseName:
                      dueCount > 0 && newCount === 0 ? "Review" : "New words",
                  wordIds: practiceBatch!.wordIds.slice(0, finishGoalWords),
                  kind: dueCount > 0 && newCount === 0 ? "review" : "new",
              })
            : null;

    // Prefer due review (spaced repetition on schedule), then new words.
    const primary: NextPracticeAction["primary"] = reviewDueHref
        ? {
              label: `Review ${dueCount} due word${dueCount === 1 ? "" : "s"}`,
              href: reviewDueHref,
              kind: "review",
          }
        : learnNewHref
          ? {
                label: `Learn ${newCount} new word${newCount === 1 ? "" : "s"}`,
                href: learnNewHref,
                kind: "new",
            }
          : null;

    return {
        last,
        dueCount,
        newCount,
        practicePoolCount,
        wordsLoading,
        goal,
        allCaughtUp: !wordsLoading && dueCount === 0 && newCount === 0,
        primary,
        reviewDueHref,
        learnNewHref,
        finishGoalHref,
        finishGoalWords,
    };
}
