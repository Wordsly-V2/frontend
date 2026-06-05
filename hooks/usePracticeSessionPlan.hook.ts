import { useMemo } from "react";
import type { PracticeSessionKind } from "@/lib/practice-session";
import {
    buildLeechWordIds,
    buildPracticeSessionPlan,
    inferPracticeSessionKind,
    type PracticeSessionPlan,
} from "@/lib/word-progress-stage";
import type { IWord } from "@/types/courses/courses.type";
import type { IWordProgressResponse } from "@/types/word-progress/word-progress.type";

interface UsePracticeSessionPlanResult {
    sessionKind: PracticeSessionKind;
    sessionPlan: PracticeSessionPlan | null;
    leechWordIds: Set<string>;
    isReview: boolean;
}

export function usePracticeSessionPlan(
    words: IWord[] | undefined,
    progressByWordId: Record<string, IWordProgressResponse | null> | undefined,
    urlSessionKind: PracticeSessionKind,
): UsePracticeSessionPlanResult {
    return useMemo(() => {
        if (!words?.length) {
            return {
                sessionKind: urlSessionKind,
                sessionPlan: null,
                leechWordIds: new Set<string>(),
                isReview: urlSessionKind === "review",
            };
        }

        const sessionPlan = buildPracticeSessionPlan(words, progressByWordId);
        const sessionKind = inferPracticeSessionKind(sessionPlan.counts, urlSessionKind);

        return {
            sessionKind,
            sessionPlan,
            leechWordIds: buildLeechWordIds(progressByWordId),
            isReview: sessionKind === "review",
        };
    }, [words, progressByWordId, urlSessionKind]);
}
