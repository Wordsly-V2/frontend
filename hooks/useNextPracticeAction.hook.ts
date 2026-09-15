"use client";

import {
    dailyGoalProgress,
    getLocalDailyHabit,
} from "@/lib/daily-habit";
import { describeSessionCap, practiceCtaLabel } from "@/lib/due-words-limit";
import { getLastLearnCourse } from "@/lib/learning-session";
import { buildPracticeUrl } from "@/lib/practice-session";
import { useDueWordsLimit } from "@/hooks/useDueWordsLimit.hook";
import { useNewWordsLimit } from "@/hooks/useNewWordsLimit.hook";
import { useOfflinePracticePool } from "@/hooks/useOfflinePracticePool.hook";
import { useOnlineStatus } from "@/hooks/useOnlineStatus.hook";
import { useDailyHabitDisplay } from "@/queries/daily-habit.query";
import { useGetDueWordIdsQuery } from "@/queries/word-progress.query";
import { usePathname } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

export type NextPracticeAction = {
    /** Last opened course, or null if the learner hasn't started one. */
    last: ReturnType<typeof getLastLearnCourse>;
    /** Due words in THIS session — already capped by the limits and daily pacing. */
    dueCount: number;
    newCount: number;
    /**
     * Due/new words in scope before any cap. These are the numbers the progress
     * cards show, so the CTA quotes them too rather than letting a learner read
     * "15 due" and then be handed a session of eight with no explanation.
     */
    dueTotal: number;
    newTotal: number;
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
    /**
     * One line saying why this session is smaller than the totals above, or null
     * when it holds everything that is waiting.
     */
    capNotice: string | null;
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
 * Single source of truth for "what should the learner practise next".
 * Shared by the dashboard hero, the mobile bottom-bar Practice CTA, and the
 * session-summary loop-back.
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
    // Passing no courseId scopes the request to every word the user owns.
    //
    // One request, not two. This used to fire the same endpoint twice, with and
    // without new words, and subtract one id list from the other to recover the
    // new ones. The server now labels both halves itself, which removes both the
    // duplicate scope resolution and the chance of the two answers disagreeing.
    const { data: session, isLoading } = useGetDueWordIdsQuery(
        { limit: dueWordsLimit, newLimit: newWordsLimit, includeNew: true },
        dueWordsLimit > 0,
    );

    // The all-courses endpoint has no offline equivalent — there is no cached
    // list of every word the learner owns. Fall back to whatever the warmer made
    // available for the last course, so the dashboard still offers a real
    // session instead of claiming there is nothing to do.
    const offlineFallback = useOfflinePracticePool({
        enabled: isOffline && !session,
        dueWordsLimit,
        newWordsLimit,
        courseId: last?.id,
    });

    /** True when the counts below came from local data, not the server. */
    const isOfflineEstimate = !session && offlineFallback.isReady;

    const dueWordIdList = session?.dueWordIds ?? offlineFallback.dueIds;
    const newWordIdList = session?.newWordIds ?? offlineFallback.newIds;
    const poolWordIdList = session?.wordIds ?? offlineFallback.allIds;

    const dueCount = dueWordIdList.length;
    const newCount = newWordIdList.length;
    const dueTotal = session?.dueTotal ?? offlineFallback.dueTotal;
    const newTotal = session?.newTotal ?? offlineFallback.newTotal;
    const practicePoolCount = poolWordIdList.length;
    const wordsLoading = isLoading && !offlineFallback.isReady;

    const capNotice = describeSessionCap({
        dueCount,
        dueTotal,
        newCount,
        newTotal,
        pacing: session?.pacing,
    });

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
                  wordIds: newWordIdList,
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
              label: practiceCtaLabel("review", dueCount, dueTotal),
              href: reviewDueHref,
              kind: "review",
          }
        : learnNewHref
          ? {
                label: practiceCtaLabel("new", newCount, newTotal),
                href: learnNewHref,
                kind: "new",
            }
          : null;

    return {
        last,
        dueCount,
        newCount,
        dueTotal,
        newTotal,
        practicePoolCount,
        wordsLoading,
        goal,
        allCaughtUp: !wordsLoading && dueCount === 0 && newCount === 0,
        primary,
        capNotice,
        reviewDueHref,
        learnNewHref,
        finishGoalHref,
        finishGoalWords,
        isOfflineEstimate,
    };
}
