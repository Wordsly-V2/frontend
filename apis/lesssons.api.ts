import axiosInstance from "@/lib/axios";
import { CreateMyCourseLesson } from "@/types/courses/courses.type";

export const createMyCourseLesson = async (courseId: string, lesson: CreateMyCourseLesson): Promise<{ success: boolean }> => {
    const response = await axiosInstance.post<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons`, lesson);
    return response.data;
}

export const updateMyCourseLesson = async (courseId: string, lessonId: string, lesson: CreateMyCourseLesson): Promise<{ success: boolean }> => {
    const response = await axiosInstance.put<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons/${lessonId}`, lesson);
    return response.data;
}

export const deleteMyCourseLesson = async (courseId: string, lessonId: string): Promise<{ success: boolean }> => {
    const response = await axiosInstance.delete<{ success: boolean }>(`/courses/me/my-courses/${courseId}/lessons/${lessonId}`);
    return response.data;
}
