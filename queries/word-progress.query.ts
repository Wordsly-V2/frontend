import {
    getDueWordIds,
    getDueWords,
    getProgressStats,
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

export const useGetProgressStatsQuery = (
    courseId?: string,
    lessonId?: string,
    enabled: boolean = true
) => useQuery<IWordProgressStats>({
    queryKey: ['word-progress', 'stats', courseId, lessonId],
    queryFn: () => getProgressStats(courseId, lessonId),
    enabled,
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
