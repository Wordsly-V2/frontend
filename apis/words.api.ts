import axiosInstance from "@/lib/axios";
import { CreateMyWord, IWord, IWordPronunciation } from "@/types/courses/courses.type";
import { AxiosError } from "axios";

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

export const moveMyWord = async (courseId: string, lessonId: string, wordId: string, targetLessonId: string): Promise<{ success: boolean }> => {
    try {
        const response = await axiosInstance.put<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words/${wordId}/move`, { targetLessonId });
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

export const bulkMoveMyWords = async (courseId: string, lessonId: string, wordIds: string[], targetLessonId: string): Promise<{ success: boolean }> => {
    try {
        const response = await axiosInstance.put<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words/bulk-move`, { wordIds, targetLessonId });
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

export const getWordsByIds = async (courseId: string, wordIds: string[]): Promise<IWord[]> => {
    try {
        const response = await axiosInstance.get<IWord[]>(`/courses/me/my-courses/${courseId}/words`, { params: { ids: wordIds.join(",") } });
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

export const fetchWordDetailsDictionary = async (word: string): Promise<IWordPronunciation[]> => {
    try {
        const response = await axiosInstance.get<IWordPronunciation[]>(`/words/pronunciation/${word}`);
        const seen = new Set<string>();
        return response.data.filter((p) => {
            if (seen.has(p.url)) return false;
            seen.add(p.url);
            return true;
        });
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}