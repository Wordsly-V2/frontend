import { getDueWordIds } from "@/apis/word-progress.api";
import {
    completePathLesson,
    hydratePathItems,
    enrollPath,
    getPathCheckpoint,
    getPathLesson,
    getPathMe,
    getPathTree,
    getPathUnit,
    submitPathCheckpoint,
} from "@/apis/path.api";
import { PATH_REVIEW_SESSION_SIZE } from "@/lib/path/path-tree";
import { queryKeys } from "@/lib/query-keys";
import type {
    CompletePathLessonDto,
    PathItem,
    PathCheckpointView,
    PathLessonView,
    PathMe,
    PathTree,
    PathUnitView,
    SubmitPathCheckpointDto,
} from "@/types/path/path.type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Release content only changes when an admin publishes, and `me` tells us when
 * that happens (its `release.id`), so the map can stay fresh for a long time.
 */
const CONTENT_STALE_TIME = 30 * 60 * 1000;

export const usePathTreeQuery = () =>
    useQuery<PathTree | null>({
        queryKey: queryKeys.path.tree(),
        queryFn: getPathTree,
        staleTime: CONTENT_STALE_TIME,
    });

export const usePathMeQuery = () =>
    useQuery<PathMe>({
        queryKey: queryKeys.path.me(),
        queryFn: getPathMe,
    });

export const usePathUnitQuery = (unitId: string, enabled: boolean = true) =>
    useQuery<PathUnitView>({
        queryKey: queryKeys.path.unit(unitId),
        queryFn: () => getPathUnit(unitId),
        enabled: enabled && !!unitId,
    });

export const usePathLessonQuery = (lessonId: string, enabled: boolean = true) =>
    useQuery<PathLessonView>({
        queryKey: queryKeys.path.lesson(lessonId),
        queryFn: () => getPathLesson(lessonId),
        enabled: enabled && !!lessonId,
    });

/** Fetched fresh on every visit: the questions must match the active release. */
export const usePathCheckpointQuery = (unitId: string) =>
    useQuery<PathCheckpointView>({
        queryKey: queryKeys.path.checkpoint(unitId),
        queryFn: () => getPathCheckpoint(unitId),
        enabled: !!unitId,
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false,
    });

/** Up to `limit` due Path items, hydrated, plus the counts they came from. */
export interface PathDueItems {
    items: PathItem[];
    /** Every due Path item, uncapped. */
    dueTotal: number;
    /** Reviews left under today's `dailyReviewLimit` (shared with vocabulary). */
    reviewsRemainingToday: number | undefined;
}

/** New items only come in through lessons, so a review never includes them. */
async function fetchDuePathItems(limit: number): Promise<PathDueItems> {
    const { dueWordIds, dueTotal, pacing } = await getDueWordIds({
        source: "path",
        limit,
        includeNew: false,
    });
    return {
        items: dueWordIds.length > 0 ? await hydratePathItems(dueWordIds) : [],
        dueTotal,
        reviewsRemainingToday: pacing?.reviewsRemainingToday,
    };
}

/**
 * Path items due for review, hydrated, for a lesson's warm-up. Empty when none
 * are due. Fetched fresh each time a lesson starts.
 */
export const usePathWarmupQuery = (lessonId: string, limit: number) =>
    useQuery<PathItem[]>({
        queryKey: queryKeys.path.warmup(lessonId, limit),
        queryFn: async () => (await fetchDuePathItems(limit)).items,
        staleTime: 0,
        gcTime: 0,
    });

/**
 * One /path/review session. Fetched fresh on every visit and never refetched
 * underneath it: the engine builds its queue once from the first result.
 */
export const usePathReviewQuery = (limit: number) =>
    useQuery<PathDueItems>({
        queryKey: queryKeys.path.review(limit),
        queryFn: () => fetchDuePathItems(limit),
        staleTime: Infinity,
        gcTime: 0,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

/**
 * How many Path items are due now, for the Review buttons. Only ids, no
 * hydrate; the session size is what `/path/review` would start with.
 */
export const usePathDueCountQuery = (enabled: boolean = true) =>
    useQuery({
        queryKey: queryKeys.path.dueCount(),
        queryFn: async () => {
            const { dueWordIds, dueTotal } = await getDueWordIds({
                source: "path",
                limit: PATH_REVIEW_SESSION_SIZE,
                includeNew: false,
            });
            return { sessionCount: dueWordIds.length, dueTotal };
        },
        enabled,
        staleTime: 60 * 1000,
    });

/**
 * Enrolling unlocks the first unit, so everything under `path` that carries a
 * lock state is stale afterwards. `me` comes back in the response and is
 * written straight into the cache.
 */
export const useEnrollPathMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: enrollPath,
        onSuccess: (me) => {
            queryClient.setQueryData(queryKeys.path.me(), me);
            return queryClient.invalidateQueries({
                queryKey: queryKeys.path.all,
                predicate: (query) => query.queryKey[1] !== "me",
            });
        },
    });
};

export const useCompletePathLessonMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ lessonId, body }: { lessonId: string; body: CompletePathLessonDto }) =>
            completePathLesson(lessonId, body),
        onSuccess: ({ me }) => {
            queryClient.setQueryData(queryKeys.path.me(), me);
            return queryClient.invalidateQueries({
                queryKey: queryKeys.path.all,
                predicate: (query) => query.queryKey[1] !== "me",
            });
        },
    });
};

/**
 * A pass opens the next unit, so like a completion it writes `me` and drops
 * the rest of `path`, except the checkpoint being shown (the attempt screen
 * must not reload its questions under the results).
 */
export const useSubmitPathCheckpointMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ unitId, body }: { unitId: string; body: SubmitPathCheckpointDto }) =>
            submitPathCheckpoint(unitId, body),
        onSuccess: ({ me }) => {
            queryClient.setQueryData(queryKeys.path.me(), me);
            return queryClient.invalidateQueries({
                queryKey: queryKeys.path.all,
                predicate: (query) => query.queryKey[1] !== "me" && query.queryKey[1] !== "checkpoint",
            });
        },
    });
};
