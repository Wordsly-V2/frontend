import {
    getDueWordIds,
    getDueWordIdsByWordIds,
    getDueWords,
    getProgressByWordIds,
    getProgressStats,
    getProgressStatsByCourseIds,
    getProgressStatsByLessonIds,
    getProgressStatsByWordIds,
    getWordProgress,
    recordAnswer,
    resetProgress
} from "@/apis/word-progress.api";
import {
    IDueWord,
    IRecordAnswerDto,
    IWordProgressResponse,
    IWordProgressStats
} from "@/types/word-progress/word-progress.type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useRecordAnswerMutation = () => {
    return useMutation<IWordProgressResponse, Error, IRecordAnswerDto>({
        mutationFn: recordAnswer,
    });
};

export const useGetDueWordsQuery = (
    courseId?: string,
    lessonId?: string,
    limit?: number,
    includeNew?: boolean,
    enabled: boolean = true
) => useQuery<IDueWord[]>({
    queryKey: ['due-words', courseId, lessonId, limit, includeNew],
    queryFn: () => getDueWords(courseId, lessonId, limit, includeNew),
    enabled,
});

export const useGetDueWordIdsQuery = (
    courseId?: string,
    lessonId?: string,
    limit?: number,
    includeNew?: boolean,
    enabled: boolean = true
) => useQuery<{ wordIds: string[] }>({
    queryKey: ['due-word-ids', courseId, lessonId, limit, includeNew],
    queryFn: () => getDueWordIds(courseId, lessonId, limit, includeNew),
    enabled,
});

export const useGetDueWordIdsByWordIdsQuery = (
    wordIds: string[],
    limit?: number,
    includeNew?: boolean,
    enabled: boolean = true,
) => useQuery<{ wordIds: string[] }>({
    queryKey: ['due-word-ids', 'by-word-ids', wordIds, limit, includeNew],
    queryFn: () => getDueWordIdsByWordIds(wordIds, limit, includeNew),
    enabled: enabled && wordIds.length > 0,
});

export const useGetProgressStatsQuery = (
    courseId?: string,
    lessonId?: string,
    enabled: boolean = true
) => useQuery<IWordProgressStats>({
    queryKey: ['word-progress', 'stats', courseId, lessonId],
    queryFn: () => getProgressStats(courseId, lessonId),
    enabled,
});

export const useGetProgressStatsByWordIdsQuery = (
    wordIds: string[],
    enabled: boolean = true,
) => useQuery<IWordProgressStats>({
    queryKey: ['word-progress', 'stats', 'by-word-ids', wordIds],
    queryFn: () => getProgressStatsByWordIds(wordIds),
    enabled: enabled && wordIds.length > 0,
});

export const useGetProgressStatsByCourseIdsQuery = (
    courseIds: string[],
    enabled: boolean = true,
) => useQuery<Record<string, IWordProgressStats>>({
    queryKey: ['word-progress', 'stats', 'by-course-ids', courseIds],
    queryFn: () => getProgressStatsByCourseIds(courseIds),
    enabled: enabled && courseIds.length > 0,
});

export const useGetProgressStatsByLessonIdsQuery = (
    lessonIds: string[],
    enabled: boolean = true,
) => useQuery<Record<string, IWordProgressStats>>({
    queryKey: ['word-progress', 'stats', 'by-lesson-ids', lessonIds],
    queryFn: () => getProgressStatsByLessonIds(lessonIds),
    enabled: enabled && lessonIds.length > 0,
});

export const useGetProgressByWordIdsQuery = (
    wordIds: string[],
    enabled: boolean = true,
) => useQuery<Record<string, IWordProgressResponse | null>>({
    queryKey: ['word-progress', 'by-word-ids', wordIds],
    queryFn: () => getProgressByWordIds(wordIds),
    enabled: enabled && wordIds.length > 0,
});

export const useGetWordProgressQuery = (
    wordId: string,
    enabled: boolean = true
) => useQuery<IWordProgressResponse | null>({
    queryKey: ['word-progress', wordId],
    queryFn: () => getWordProgress(wordId),
    enabled,
});

export const useResetProgressMutation = () => {
    const queryClient = useQueryClient();
    
    return useMutation<{ success: boolean }, Error, string>({
        mutationFn: resetProgress,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['word-progress'] });
            queryClient.invalidateQueries({ queryKey: ['due-words'] });
        },
    });
};
