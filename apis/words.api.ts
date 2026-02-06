import axios from "axios";
import axiosInstance from "@/lib/axios";
import { CreateMyWord, IDictionaryWord, IWord } from "@/types/courses/courses.type";

export const createMyWord = async (courseId: string, lessonId: string, word: CreateMyWord): Promise<{ success: boolean }> => {
    const response = await axiosInstance.post<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words`, word);
    return response.data;
}

export const updateMyWord = async (courseId: string, lessonId: string, wordId: string, word: CreateMyWord): Promise<{ success: boolean }> => {
    const response = await axiosInstance.put<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words/${wordId}`, word);
    return response.data;
}

export const deleteMyWord = async (courseId: string, lessonId: string, wordId: string): Promise<{ success: boolean }> => {
    const response = await axiosInstance.delete<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words/${wordId}`);
    return response.data;
}

export const moveMyWord = async (courseId: string, lessonId: string, wordId: string, targetLessonId: string): Promise<{ success: boolean }> => {
    const response = await axiosInstance.put<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words/${wordId}/move`, { targetLessonId });
    return response.data;
}

export const bulkDeleteMyWords = async (courseId: string, lessonId: string, wordIds: string[]): Promise<{ success: boolean }> => {
    const response = await axiosInstance.delete<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words/bulk-delete`, { data: { wordIds } });
    return response.data;
}

export const bulkMoveMyWords = async (courseId: string, lessonId: string, wordIds: string[], targetLessonId: string): Promise<{ success: boolean }> => {
    const response = await axiosInstance.put<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words/bulk-move`, { wordIds, targetLessonId });
    return response.data;
}

export const getWordsByIds = async (courseId: string, wordIds: string[]): Promise<IWord[]> => {
    const response = await axiosInstance.get<IWord[]>(`/courses/me/my-courses/${courseId}/words`, { params: { ids: wordIds.join(",") } });
    return response.data;
}

export const fetchWordDetailsDictionary = async (word: string): Promise<IDictionaryWord> => {
    const response = await axios.get<IDictionaryWord[]>(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`); 
    return response.data[0];
}