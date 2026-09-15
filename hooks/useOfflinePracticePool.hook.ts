"use client";

import { selectDueWordIdsOffline } from "@/lib/offline/due-word-selection";
import { pickCachedProgress } from "@/lib/offline/progress-cache";
import type { OfflinePool } from "@/lib/offline/warmup";
import { queryKeys } from "@/lib/query-keys";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

export interface OfflinePracticePool {
    dueIds: string[];
    newIds: string[];
    allIds: string[];
    /** Uncapped counts in the cached pool, mirroring the server's totals. */
    dueTotal: number;
    newTotal: number;
    isReady: boolean;
}

const EMPTY: OfflinePracticePool = {
    dueIds: [],
    newIds: [],
    allIds: [],
    dueTotal: 0,
    newTotal: 0,
    isReady: false,
};

/**
 * A practice session built entirely from cached data.
 *
 * The dashboard's normal source is the all-courses due-words endpoint, which has
 * no offline equivalent — nothing caches the learner's complete word list. What
 * we do have is the pool the warmer prepared for the course they were last
 * using, so offline the dashboard offers a session from that instead of falsely
 * reporting nothing to practise.
 */
export function useOfflinePracticePool(params: {
    enabled: boolean;
    dueWordsLimit: number;
    newWordsLimit: number;
    courseId?: string;
}): OfflinePracticePool {
    const { enabled, dueWordsLimit, newWordsLimit, courseId } = params;
    const queryClient = useQueryClient();

    return useMemo(() => {
        if (!enabled || !courseId) return EMPTY;

        const pool = queryClient.getQueryData<OfflinePool>(
            queryKeys.offlinePool.forCourse(courseId),
        );
        if (!pool || pool.wordIds.length === 0) return EMPTY;

        const progressByWordId = pickCachedProgress(queryClient, pool.wordIds);

        const session = selectDueWordIdsOffline({
            wordIds: pool.wordIds,
            progressByWordId,
            limit: dueWordsLimit,
            newLimit: newWordsLimit,
            includeNew: true,
        });

        return {
            dueIds: session.dueWordIds,
            newIds: session.newWordIds,
            allIds: session.wordIds,
            dueTotal: session.dueTotal,
            newTotal: session.newTotal,
            isReady: true,
        };
    }, [courseId, dueWordsLimit, enabled, newWordsLimit, queryClient]);
}
