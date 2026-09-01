import { apiPaths } from "@/lib/api-paths";
import { request } from "@/lib/axios";
import { CreateMyLesson, ILessonSummary } from "@/types/courses/courses.type";

export const getLessonsByCourseId = (courseId: string): Promise<ILessonSummary[]> =>
    request((i) => i.get(apiPaths.lessons.root(courseId)));

export const createMyCourseLesson = (courseId: string, lesson: CreateMyLesson): Promise<{ success: boolean }> =>
    request((i) => i.post(apiPaths.lessons.root(courseId), lesson));

export const updateMyCourseLesson = (courseId: string, lessonId: string, lesson: CreateMyLesson): Promise<{ success: boolean }> =>
    request((i) => i.put(apiPaths.lessons.byId(courseId, lessonId), lesson));

export const deleteMyCourseLesson = (courseId: string, lessonId: string): Promise<{ success: boolean }> =>
    request((i) => i.delete(apiPaths.lessons.byId(courseId, lessonId)));

export const reorderMyCourseLessons = (courseId: string, lessonId: string, targetOrderIndex: number): Promise<{ success: boolean }> =>
    request((i) => i.put(apiPaths.lessons.reorder(courseId), { lessonId, targetOrderIndex }));
