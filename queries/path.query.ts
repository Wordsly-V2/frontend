import {
    completePathLesson,
    enrollPath,
    getPathLesson,
    getPathMe,
    getPathTree,
    getPathUnit,
} from "@/apis/path.api";
import { queryKeys } from "@/lib/query-keys";
import type {
    CompletePathLessonDto,
    PathLessonView,
    PathMe,
    PathTree,
    PathUnitView,
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
