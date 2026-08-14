"use client";

import {
    dailyGoalProgress,
    getLocalDailyHabit,
} from "@/lib/daily-habit";
import { deriveNewWordIds } from "@/lib/due-words-limit";
import { getLastLearnCourse } from "@/lib/learning-session";
import { buildPracticeUrl } from "@/lib/practice-session";
import { useDueWordsLimit } from "@/hooks/useDueWordsLimit.hook";
import { useNewWordsLimit } from "@/hooks/useNewWordsLimit.hook";
import { useOfflinePracticePool } from "@/hooks/useOfflinePracticePool.hook";
import { useOnlineStatus } from "@/hooks/useOnlineStatus.hook";
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
    /**
     * True when the counts came from the locally warmed pool rather than the
     * server. The UI labels these as an offline copy — they cover the last
     * course only, not every course the learner owns.
     */
    isOfflineEstimate: boolean;
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
    // Batch sizes come from the shared stores so live edits from the practice
    // settings dialog re-render this hook immediately (see useDueWordsLimit).
    const { dueWordsLimit } = useDueWordsLimit();
    const { newWordsLimit } = useNewWordsLimit();
    const isOffline = useOnlineStatus() === "offline";
    const { habit: serverHabit } = useDailyHabitDisplay();
    const habit = serverHabit ?? getLocalDailyHabit();
    const goal = dailyGoalProgress(habit.wordsToday, habit.goal);

    useEffect(() => {
        startTransition(() => {
            setLast(getLastLearnCourse());
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
            { limit: dueWordsLimit, newLimit: newWordsLimit, includeNew: true },
            enabled,
        );

    // The all-courses endpoint has no offline equivalent — there is no cached
    // list of every word the learner owns. Fall back to whatever the warmer made
    // available for the last course, so the dashboard still offers a real
    // session instead of claiming there is nothing to do.
    const offlineFallback = useOfflinePracticePool({
        enabled: isOffline && !dueIds && !practiceBatch,
        dueWordsLimit,
        newWordsLimit,
        courseId: last?.id,
    });

    const dueCount = dueIds?.wordIds.length ?? offlineFallback.dueIds.length;
    const newWordIds = useMemo(
        () =>
            dueIds || practiceBatch
                ? deriveNewWordIds(dueIds?.wordIds, practiceBatch?.wordIds)
                : offlineFallback.newIds,
        [dueIds, practiceBatch, offlineFallback.newIds],
    );
    const newCount = newWordIds.length;
    const practicePoolCount =
        practiceBatch?.wordIds.length ?? offlineFallback.allIds.length;
    const wordsLoading =
        (dueLoading || practiceBatchLoading) && !offlineFallback.isReady;

    /** True when the counts above came from local data, not the server. */
    const isOfflineEstimate =
        !dueIds && !practiceBatch && offlineFallback.isReady;

    const dueWordIdList = dueIds?.wordIds ?? offlineFallback.dueIds;
    const poolWordIdList = practiceBatch?.wordIds ?? offlineFallback.allIds;

    const reviewDueHref =
        dueCount > 0
            ? buildPracticeUrl({
                  courseId: isOfflineEstimate ? last?.id : undefined,
                  courseName: "Review",
                  wordIds: dueWordIdList,
                  kind: "review",
              })
            : null;

    const learnNewHref =
        newCount > 0
            ? buildPracticeUrl({
                  courseId: isOfflineEstimate ? last?.id : undefined,
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
                  courseId: isOfflineEstimate ? last?.id : undefined,
                  courseName:
                      dueCount > 0 && newCount === 0 ? "Review" : "New words",
                  wordIds: poolWordIdList.slice(0, finishGoalWords),
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
        isOfflineEstimate,
    };
}
