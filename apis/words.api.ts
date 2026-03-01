import axiosInstance from "@/lib/axios";
import { CreateMyWord, IUserWordSearchResult, IWord } from "@/types/courses/courses.type";
import { AxiosError } from "axios";

export const createMyWordsBulk = async (
    courseId: string,
    lessonId: string,
    words: CreateMyWord[]
): Promise<{ success: boolean; count?: number }> => {
    try {
        const response = await axiosInstance.post<{ success: boolean; count?: number }>(
            `/courses/me/my-courses/${courseId}/lessons/${lessonId}/words/bulk`,
            { words }
        );
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};

export const searchMyWords = async (word: string): Promise<IUserWordSearchResult[]> => {
    try {
        const response = await axiosInstance.get<IUserWordSearchResult[]>(
            `/dictionary/my-words/search/${encodeURIComponent(word.trim())}`
        );
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};

export const createMyWord = async (courseId: string, lessonId: string, word: CreateMyWord): Promise<{ success: boolean }> => {
    try {
        const response = await axiosInstance.post<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words`, word);
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

export const updateMyWord = async (courseId: string, lessonId: string, wordId: string, word: CreateMyWord): Promise<{ success: boolean }> => {
    try {
        const response = await axiosInstance.put<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words/${wordId}`, word);
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

export const deleteMyWord = async (courseId: string, lessonId: string, wordId: string): Promise<{ success: boolean }> => {
    try {
        const response = await axiosInstance.delete<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words/${wordId}`);
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

export const moveMyWord = async (
    courseId: string,
    lessonId: string,
    wordId: string,
    targetLessonId: string,
    targetCourseId?: string
): Promise<{ success: boolean }> => {
    try {
        const body = targetCourseId ? { targetLessonId, targetCourseId } : { targetLessonId };
        const response = await axiosInstance.put<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words/${wordId}/move`, body);
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

export const bulkDeleteMyWords = async (courseId: string, lessonId: string, wordIds: string[]): Promise<{ success: boolean }> => {
    try {
        const response = await axiosInstance.delete<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words/bulk-delete`, { data: { wordIds } });
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

export const bulkMoveMyWords = async (
    courseId: string,
    lessonId: string,
    wordIds: string[],
    targetLessonId: string,
    targetCourseId?: string
): Promise<{ success: boolean }> => {
    try {
        const body = targetCourseId ? { wordIds, targetLessonId, targetCourseId } : { wordIds, targetLessonId };
        const response = await axiosInstance.put<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words/bulk-move`, body);
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};

/** Delete multiple words from a course (words can be from any lesson). */
export const bulkDeleteMyWordsFromCourse = async (courseId: string, wordIds: string[]): Promise<{ count: number }> => {
    try {
        const response = await axiosInstance.delete<{ count: number }>(
            `/courses/me/my-courses/${courseId}/words/bulk-delete`,
            { data: { wordIds } }
        );
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};

/** Move multiple words to a target lesson (words can be from any lesson in the course; target can be in another course). */
export const bulkMoveMyWordsFromCourse = async (
    courseId: string,
    wordIds: string[],
    targetLessonId: string
): Promise<{ count: number }> => {
    try {
        const response = await axiosInstance.put<{ count: number }>(
            `/courses/me/my-courses/${courseId}/words/bulk-move`,
            { wordIds, targetLessonId }
        );
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};

export const getWordsByIds = async (courseId: string, wordIds: string[]): Promise<IWord[]> => {
    try {
        const response = await axiosInstance.get<IWord[]>(`/courses/me/my-courses/${courseId}/words`, { params: { ids: wordIds.join(",") } });
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}
