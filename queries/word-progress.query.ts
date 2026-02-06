import { 
    recordAnswer, 
    recordAnswers, 
    getDueWords, 
    getProgressStats, 
    getWordProgress, 
    resetProgress 
} from "@/apis/word-progress.api";
import { 
    IRecordAnswerDto, 
    IBulkRecordAnswersDto, 
    IWordProgressResponse, 
    IDueWord,
    IWordProgressStats 
} from "@/types/word-progress/word-progress.type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useRecordAnswerMutation = () => {
    const queryClient = useQueryClient();
    
    return useMutation<IWordProgressResponse, Error, IRecordAnswerDto>({
        mutationFn: recordAnswer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['word-progress'] });
            queryClient.invalidateQueries({ queryKey: ['due-words'] });
        },
    });
};

export const useRecordAnswersMutation = () => {
    const queryClient = useQueryClient();
    
    return useMutation<IWordProgressResponse[], Error, IBulkRecordAnswersDto>({
        mutationFn: recordAnswers,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['word-progress'] });
            queryClient.invalidateQueries({ queryKey: ['due-words'] });
        },
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
