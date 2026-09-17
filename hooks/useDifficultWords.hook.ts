import { useMemo } from "react";
import {
    useGetSavedWordsQuery,
    useToggleSavedWordMutation,
} from "@/queries/saved-words.query";
import {
    useGetLeechesQuery,
    useUnsuspendWordMutation,
} from "@/queries/word-progress.query";
import { useAppSelector } from "@/store/hooks";

export type DifficultWordsFilter = "all" | "saved" | "detected";

/** One word that needs extra attention, from either direction. */
export interface DifficultWordRowData {
    wordId: string;
    /** The learner flagged it themselves. */
    isSaved: boolean;
    /** The scheduler flagged it after enough lapses. */
    isDetected: boolean;
    successRate: number;
    totalReviews: number;
    lapses: number;
    suspended: boolean;
    /** Settled again: a Review-state card on a run of correct answers. */
    isSettled: boolean;
    note?: string;
}

/**
 * The merged difficult-word list for a scope.
 *
 * Two sources, one list: words the learner saved and words the scheduler
 * flagged as leeches. A word can be on both, so they are deduped and each row
 * carries why it is there — showing two near-identical lists would only make
 * the learner choose between them.
 *
 * `courseId` omitted means every course.
 */
export function useDifficultWords(
    courseId: string | undefined,
    filter: DifficultWordsFilter = "all",
) {
    const userLoginId = useAppSelector(
        (state) => state.user.profile?.userLoginId ?? null,
    );
    const { data: leechData, isLoading: leechesLoading } = useGetLeechesQuery({
        courseId,
    });
    const { data: savedData, isLoading: savedLoading } = useGetSavedWordsQuery({
        courseId,
    });
    const unsuspend = useUnsuspendWordMutation();
    const unsave = useToggleSavedWordMutation({ courseId }, userLoginId);

    const allRows = useMemo<DifficultWordRowData[]>(() => {
        const leeches = leechData?.leeches ?? [];
        const saved = savedData?.savedWords ?? [];
        const savedIds = new Set(saved.map((word) => word.wordId));
        const leechByWordId = new Map(
            leeches.map((leech) => [leech.wordId, leech]),
        );

        return [
            // Saved first: the learner's own picks outrank the algorithm's.
            ...saved.map((word) => {
                const leech = leechByWordId.get(word.wordId);
                return {
                    wordId: word.wordId,
                    isSaved: true,
                    isDetected: word.isLeech || leech != null,
                    successRate: word.successRate,
                    totalReviews: word.totalReviews,
                    lapses: leech?.lapses ?? 0,
                    suspended: leech?.suspendedAt != null,
                    isSettled: word.isSettled,
                    note: word.note,
                };
            }),
            ...leeches
                .filter((leech) => !savedIds.has(leech.wordId))
                .map((leech) => ({
                    wordId: leech.wordId,
                    isSaved: false,
                    isDetected: true,
                    successRate: leech.successRate,
                    totalReviews: leech.totalReviews,
                    lapses: leech.lapses,
                    suspended: leech.suspendedAt != null,
                    isSettled: false,
                    note: undefined,
                })),
        ];
    }, [leechData, savedData]);

    const rows = useMemo(() => {
        if (filter === "saved") return allRows.filter((row) => row.isSaved);
        if (filter === "detected") return allRows.filter((row) => row.isDetected);
        return allRows;
    }, [allRows, filter]);

    return {
        /** The filtered view — what to render and what "Practice them" runs. */
        rows,
        /** Every row regardless of filter, for counts and the empty state. */
        allRows,
        // Gate on data, not on fetch outcome: offline these resolve from the
        // persisted cache and report an error alongside usable data.
        isLoading: (leechesLoading || savedLoading) && allRows.length === 0,
        unsuspend,
        unsave,
    };
}
