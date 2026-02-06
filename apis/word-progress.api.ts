import axiosInstance from "@/lib/axios";
import { 
    IRecordAnswerDto, 
    IBulkRecordAnswersDto, 
    IWordProgressResponse, 
    IDueWord,
    IWordProgressStats 
} from "@/types/word-progress/word-progress.type";

export const recordAnswer = async (data: IRecordAnswerDto): Promise<IWordProgressResponse> => {
    const response = await axiosInstance.post<IWordProgressResponse>('/vocabulary/word-progress/record-answer', data);
    return response.data;
}

export const recordAnswers = async (data: IBulkRecordAnswersDto): Promise<IWordProgressResponse[]> => {
    const response = await axiosInstance.post<IWordProgressResponse[]>('/vocabulary/word-progress/record-answers', data);
    return response.data;
}

export const getDueWords = async (
    courseId?: string,
    lessonId?: string,
    limit?: number,
    includeNew?: boolean
): Promise<IDueWord[]> => {
    const response = await axiosInstance.get<IDueWord[]>('/vocabulary/word-progress/due-words', {
        params: {
            courseId,
            lessonId,
            limit,
            includeNew: includeNew?.toString(),
        },
    });
    return response.data;
}

export const getDueWordIds = async (
    courseId?: string,
    lessonId?: string,
    limit?: number,
    includeNew?: boolean
): Promise<{ wordIds: string[] }> => {
    const response = await axiosInstance.get<{ wordIds: string[] }>('/vocabulary/word-progress/due-word-ids', {
        params: {
            courseId,
            lessonId,
            limit,
            includeNew: includeNew?.toString(),
        },
    });
    return response.data;
}

export const getProgressStats = async (
    courseId?: string,
    lessonId?: string
): Promise<IWordProgressStats> => {
    const response = await axiosInstance.get<IWordProgressStats>('/vocabulary/word-progress/stats', {
        params: {
            courseId,
            lessonId,
        },
    });
    return response.data;
}

export const getWordProgress = async (wordId: string): Promise<IWordProgressResponse | null> => {
    const response = await axiosInstance.get<IWordProgressResponse | null>(`/vocabulary/word-progress/words/${wordId}`);
    return response.data;
}

export const resetProgress = async (wordId: string): Promise<{ success: boolean }> => {
    const response = await axiosInstance.delete<{ success: boolean }>(`/vocabulary/word-progress/words/${wordId}/reset`);
    return response.data;
}
