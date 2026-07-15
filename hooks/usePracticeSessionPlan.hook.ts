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

        // A leech session treats every word as a leech (flashcard + context) so
        // the whole batch gets the remediation pedagogy, not just detected ones.
        const leechWordIds =
            sessionKind === "leech"
                ? new Set(words.map((w) => w.id))
                : buildLeechWordIds(progressByWordId);

        return {
            sessionKind,
            sessionPlan,
            leechWordIds,
            // Leech remediation is recall-flavoured, so treat it like review.
            isReview: sessionKind === "review" || sessionKind === "leech",
        };
    }, [words, progressByWordId, urlSessionKind]);
}
