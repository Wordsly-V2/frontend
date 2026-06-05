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
        const response = await axiosInstance.post<IWordProgressResponse>('/word-progress/record-answer', data);
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

/** Record multiple answers synchronously when available (writes to DB directly). */
export const recordAnswerBulkSync = async (
    data: IBulkRecordAnswersDto,
): Promise<IWordProgressResponse[]> => {
    try {
        const response = await axiosInstance.post<IWordProgressResponse[]>(
            "/word-progress/record-answer/bulk-sync",
            data,
        );
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};

/** Record multiple answers in one request (bulk). Accepted for async processing. */
export const recordAnswerBulk = async (data: IBulkRecordAnswersDto): Promise<{ accepted: boolean }> => {
    try {
        const response = await axiosInstance.post<{ accepted: boolean }>(
            '/word-progress/record-answer/bulk',
            data
        );
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};

export const getDueWords = async (
    courseId?: string,
    lessonId?: string,
    limit?: number,
    includeNew?: boolean
): Promise<IDueWord[]> => {
    try {
        const response = await axiosInstance.get<IDueWord[]>('/word-progress/due-words', {
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
        const response = await axiosInstance.get<{ wordIds: string[] }>('/word-progress/due-word-ids', {
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
        const response = await axiosInstance.get<IWordProgressStats>('/word-progress/stats', {
            params: {
                courseId,
                lessonId,
            },
        });
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};

export const getProgressStatsByWordIds = async (
    wordIds: string[],
): Promise<IWordProgressStats> => {
    try {
        const response = await axiosInstance.post<IWordProgressStats>(
            '/word-progress/stats',
            { wordIds },
        );
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};

export const getDueWordIdsByWordIds = async (
    wordIds: string[],
    limit?: number,
    includeNew?: boolean,
): Promise<{ wordIds: string[] }> => {
    try {
        const response = await axiosInstance.post<{ wordIds: string[] }>(
            '/word-progress/due-word-ids/by-word-ids',
            { wordIds, limit, includeNew },
        );
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};

export const getWordProgress = async (wordId: string): Promise<IWordProgressResponse | null> => {
    try {
        const response = await axiosInstance.get<IWordProgressResponse | null>(`/word-progress/words/${wordId}`);
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

export const resetProgress = async (wordId: string): Promise<{ success: boolean }> => {
    try {
        const response = await axiosInstance.delete<{ success: boolean }>(`/word-progress/words/${wordId}/reset`);
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};

export const getProgressStatsByCourseIds = async (
    courseIds: string[],
): Promise<Record<string, IWordProgressStats>> => {
    try {
        const response = await axiosInstance.post<Record<string, IWordProgressStats>>(
            '/word-progress/stats/by-course-ids',
            { courseIds },
        );
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};

export const getProgressStatsByLessonIds = async (
    lessonIds: string[],
): Promise<Record<string, IWordProgressStats>> => {
    try {
        const response = await axiosInstance.post<Record<string, IWordProgressStats>>(
            '/word-progress/stats/by-lesson-ids',
            { lessonIds },
        );
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};

export const getProgressByWordIds = async (
    wordIds: string[],
): Promise<Record<string, IWordProgressResponse | null>> => {
    try {
        const response = await axiosInstance.post<Record<string, IWordProgressResponse | null>>(
            '/word-progress/by-word-ids',
            { wordIds },
        );
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};

export const resetProgressBulk = async (wordIds: string[]): Promise<{ count: number }> => {
    try {
        const response = await axiosInstance.delete<{ count: number }>(
            '/word-progress/words/bulk-reset',
            { data: { wordIds } }
        );
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};
