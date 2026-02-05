import axiosInstance from "@/lib/axios";
import { CreateMyWord } from "@/types/courses/courses.type";

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