import {
    getDueWordIds,
    getDueWordIdsByWordIds,
    getDueWords,
    getLeeches,
    getProgressByWordIds,
    getProgressStats,
    getProgressStatsByCourseIds,
    getProgressStatsByLessonIds,
    getProgressStatsByWordIds,
    getWordProgress,
    recordAnswerBulkSync,
    resetProgress,
    unsuspendWord
} from "@/apis/word-progress.api";
import { queryKeys } from "@/lib/query-keys";
import {
    IBulkRecordAnswersDto,
    IBulkRecordAnswersResponse,
    IDueWord,
    IDueWordIdsResponse,
    ILeechesResponse,
    IWordProgressResponse,
    IWordProgressStats,
    LeechScope,
    WordProgressScope
} from "@/types/word-progress/word-progress.type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useRecordAnswerBulkSyncMutation = () => {
    return useMutation<IBulkRecordAnswersResponse, Error, IBulkRecordAnswersDto>({
        mutationFn: recordAnswerBulkSync,
    });
};

export const useGetDueWordsQuery = (
    scope: WordProgressScope = {},
    enabled: boolean = true
) => useQuery<IDueWord[]>({
    queryKey: queryKeys.dueWords.list(scope),
    queryFn: () => getDueWords(scope),
    enabled,
});

export const useGetDueWordIdsQuery = (
    scope: WordProgressScope = {},
    enabled: boolean = true
) => useQuery<IDueWordIdsResponse>({
    queryKey: queryKeys.dueWordIds.list(scope),
    queryFn: () => getDueWordIds(scope),
    enabled,
});

export const useGetDueWordIdsByWordIdsQuery = (
    wordIds: string[],
    limit?: number,
    includeNew?: boolean,
    enabled: boolean = true,
) => useQuery<IDueWordIdsResponse>({
    queryKey: queryKeys.dueWordIds.byWordIds(wordIds, limit, includeNew),
    queryFn: () => getDueWordIdsByWordIds(wordIds, limit, includeNew),
    enabled: enabled && wordIds.length > 0,
});

export const useGetProgressStatsQuery = (
    courseId?: string,
    lessonId?: string,
    enabled: boolean = true
) => useQuery<IWordProgressStats>({
    queryKey: queryKeys.wordProgress.stats(courseId, lessonId),
    queryFn: () => getProgressStats({ courseId, lessonId }),
    enabled,
});

export const useGetProgressStatsByWordIdsQuery = (
    wordIds: string[],
    enabled: boolean = true,
) => useQuery<IWordProgressStats>({
    queryKey: queryKeys.wordProgress.statsByWordIds(wordIds),
    queryFn: () => getProgressStatsByWordIds(wordIds),
    enabled: enabled && wordIds.length > 0,
});

export const useGetProgressStatsByCourseIdsQuery = (
    courseIds: string[],
    enabled: boolean = true,
) => useQuery<Record<string, IWordProgressStats>>({
    queryKey: queryKeys.wordProgress.statsByCourseIds(courseIds),
    queryFn: () => getProgressStatsByCourseIds(courseIds),
    enabled: enabled && courseIds.length > 0,
});

export const useGetProgressStatsByLessonIdsQuery = (
    lessonIds: string[],
    enabled: boolean = true,
) => useQuery<Record<string, IWordProgressStats>>({
    queryKey: queryKeys.wordProgress.statsByLessonIds(lessonIds),
    queryFn: () => getProgressStatsByLessonIds(lessonIds),
    enabled: enabled && lessonIds.length > 0,
});

export const useGetProgressByWordIdsQuery = (
    wordIds: string[],
    enabled: boolean = true,
) => useQuery<Record<string, IWordProgressResponse | null>>({
    queryKey: queryKeys.wordProgress.byWordIds(wordIds),
    queryFn: () => getProgressByWordIds(wordIds),
    enabled: enabled && wordIds.length > 0,
});

export const useGetWordProgressQuery = (
    wordId: string,
    enabled: boolean = true
) => useQuery<IWordProgressResponse | null>({
    queryKey: queryKeys.wordProgress.word(wordId),
    queryFn: () => getWordProgress(wordId),
    enabled,
});

export const useGetLeechesQuery = (
    scope: LeechScope = {},
    enabled: boolean = true,
) => useQuery<ILeechesResponse>({
    queryKey: queryKeys.leeches.list(scope.courseId, scope.lessonId),
    queryFn: () => getLeeches(scope),
    enabled,
});

export const useUnsuspendWordMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<{ success: boolean }, Error, string>({
        mutationFn: unsuspendWord,
        onSuccess: () => {
            // Unsuspending re-enters the word into the review/due queues and
            // clears its leech/suspended state, so refresh those roots.
            queryClient.invalidateQueries({ queryKey: queryKeys.wordProgress.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.dueWords.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.dueWordIds.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.leeches.all });
        },
    });
};

export const useResetProgressMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<{ success: boolean }, Error, string>({
        mutationFn: resetProgress,
        onSuccess: () => {
            // Resetting a word affects its progress row, the due queues (both the
            // full due-words list and the id-only variants), so invalidate all
            // three roots — the id-only queue was previously left stale.
            queryClient.invalidateQueries({ queryKey: queryKeys.wordProgress.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.dueWords.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.dueWordIds.all });
        },
    });
};
