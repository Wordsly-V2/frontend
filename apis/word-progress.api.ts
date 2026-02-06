import axiosInstance from "@/lib/axios";
import {
    IBulkRecordAnswersDto,
    IDueWord,
    IRecordAnswerDto,
    IWordProgressResponse,
    IWordProgressStats
} from "@/types/word-progress/word-progress.type";
import { AxiosError } from "axios";

export const recordAnswer = async (data: IRecordAnswerDto): Promise<IWordProgressResponse> => {
    try {
        const response = await axiosInstance.post<IWordProgressResponse>('/vocabulary/word-progress/record-answer', data);
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

export const recordAnswers = async (data: IBulkRecordAnswersDto): Promise<IWordProgressResponse[]> => {
    try {
        const response = await axiosInstance.post<IWordProgressResponse[]>('/vocabulary/word-progress/record-answers', data);
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

export const getDueWords = async (
    courseId?: string,
    lessonId?: string,
    limit?: number,
    includeNew?: boolean
): Promise<IDueWord[]> => {
    try {
        const response = await axiosInstance.get<IDueWord[]>('/vocabulary/word-progress/due-words', {
            params: {
                courseId,
                lessonId,
                limit,
                includeNew: includeNew?.toString(),
            },
        });
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

export const getDueWordIds = async (
    courseId?: string,
    lessonId?: string,
    limit?: number,
    includeNew?: boolean
): Promise<{ wordIds: string[] }> => {
    try {
        const response = await axiosInstance.get<{ wordIds: string[] }>('/vocabulary/word-progress/due-word-ids', {
            params: {
                courseId,
                lessonId,
                limit,
                includeNew: includeNew?.toString(),
            },
        });
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

export const getProgressStats = async (
    courseId?: string,
    lessonId?: string
): Promise<IWordProgressStats> => {
    try {
        const response = await axiosInstance.get<IWordProgressStats>('/vocabulary/word-progress/stats', {
            params: {
                courseId,
                lessonId,
            },
        });
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

export const getWordProgress = async (wordId: string): Promise<IWordProgressResponse | null> => {
    try {
        const response = await axiosInstance.get<IWordProgressResponse | null>(`/vocabulary/word-progress/words/${wordId}`);
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

export const resetProgress = async (wordId: string): Promise<{ success: boolean }> => {
    try {
        const response = await axiosInstance.delete<{ success: boolean }>(`/vocabulary/word-progress/words/${wordId}/reset`);
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}
