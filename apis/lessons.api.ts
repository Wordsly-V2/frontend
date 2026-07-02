import { request } from "@/lib/axios";
import { CreateMyLesson, ILessonSummary } from "@/types/courses/courses.type";

export const getLessonsByCourseId = (courseId: string): Promise<ILessonSummary[]> =>
    request((i) => i.get(`/courses/me/my-courses/${courseId}/lessons`));

export const createMyCourseLesson = (courseId: string, lesson: CreateMyLesson): Promise<{ success: boolean }> =>
    request((i) => i.post(`/courses/me/my-courses/${courseId}/lessons`, lesson));

export const updateMyCourseLesson = (courseId: string, lessonId: string, lesson: CreateMyLesson): Promise<{ success: boolean }> =>
    request((i) => i.put(`/courses/me/my-courses/${courseId}/lessons/${lessonId}`, lesson));

export const deleteMyCourseLesson = (courseId: string, lessonId: string): Promise<{ success: boolean }> =>
    request((i) => i.delete(`/courses/me/my-courses/${courseId}/lessons/${lessonId}`));

export const reorderMyCourseLessons = (courseId: string, lessonId: string, targetOrderIndex: number): Promise<{ success: boolean }> =>
    request((i) => i.put(`/courses/me/my-courses/${courseId}/lessons/reorder`, { lessonId, targetOrderIndex }));
