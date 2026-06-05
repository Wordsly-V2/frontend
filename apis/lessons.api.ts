import axiosInstance from "@/lib/axios";
import { CreateMyLesson, ILessonSummary } from "@/types/courses/courses.type";
import { AxiosError } from "axios";

export const getLessonsByCourseId = async (courseId: string): Promise<ILessonSummary[]> => {
    try {
        const response = await axiosInstance.get<ILessonSummary[]>(`/courses/me/my-courses/${courseId}/lessons`);
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};

export const createMyCourseLesson = async (courseId: string, lesson: CreateMyLesson): Promise<{ success: boolean }> => {
    try {
        const response = await axiosInstance.post<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons`, lesson);
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

export const updateMyCourseLesson = async (courseId: string, lessonId: string, lesson: CreateMyLesson): Promise<{ success: boolean }> => {
    try {
        const response = await axiosInstance.put<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons/${lessonId}`, lesson);
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

export const deleteMyCourseLesson = async (courseId: string, lessonId: string): Promise<{ success: boolean }> => {
    try {
        const response = await axiosInstance.delete<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons/${lessonId}`);
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

export const reorderMyCourseLessons = async (courseId: string, lessonId: string, targetOrderIndex: number): Promise<{ success: boolean }> => {
    try {
        const response = await axiosInstance.put<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons/reorder`, { lessonId, targetOrderIndex });
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}