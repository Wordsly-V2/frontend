import { apiPaths } from "@/lib/api-paths";
import { request } from "@/lib/axios";
import type {
    AdminUserCourses,
    AdminUserCoursesQuery,
    ContentHealth,
} from "@/types/admin-vocabulary/admin-vocabulary.type";
import type {
    CreateMyLesson,
    CreateMyWord,
    CreateUpdateMyCourse,
    ICourse,
} from "@/types/courses/courses.type";

/**
 * Admin access to a learner's vocabulary. The server runs every write through
 * the learner's own services, so deleting words also drops their review
 * progress (`words_deleted`), exactly as when the learner deletes them.
 */

export const getContentHealth = (limit = 10): Promise<ContentHealth> =>
    request((i) => i.get(apiPaths.adminVocabulary.health(), { params: { limit } }));

export const getAdminUserCourses = (userLoginId: string, query: AdminUserCoursesQuery): Promise<AdminUserCourses> =>
    request((i) => i.get(apiPaths.adminVocabulary.courses(userLoginId), { params: query }));

/** One course with its lessons and their words. */
export const getAdminUserCourse = (userLoginId: string, courseId: string): Promise<ICourse> =>
    request((i) => i.get(apiPaths.adminVocabulary.course(userLoginId, courseId)));

export interface CourseRef {
    userLoginId: string;
    courseId: string;
}

export const updateAdminUserCourse = ({ userLoginId, courseId, course }: CourseRef & { course: CreateUpdateMyCourse }) =>
    request((i) => i.put(apiPaths.adminVocabulary.course(userLoginId, courseId), course));

export const deleteAdminUserCourse = ({ userLoginId, courseId }: CourseRef): Promise<{ success: true }> =>
    request((i) => i.delete(apiPaths.adminVocabulary.course(userLoginId, courseId)));

export const updateAdminUserLesson = ({
    userLoginId,
    courseId,
    lessonId,
    lesson,
}: CourseRef & { lessonId: string; lesson: CreateMyLesson }) =>
    request((i) => i.put(apiPaths.adminVocabulary.lesson(userLoginId, courseId, lessonId), lesson));

export const deleteAdminUserLesson = ({
    userLoginId,
    courseId,
    lessonId,
}: CourseRef & { lessonId: string }): Promise<{ success: true }> =>
    request((i) => i.delete(apiPaths.adminVocabulary.lesson(userLoginId, courseId, lessonId)));

export const updateAdminUserWord = ({
    userLoginId,
    courseId,
    lessonId,
    wordId,
    word,
}: CourseRef & { lessonId: string; wordId: string; word: CreateMyWord }) =>
    request((i) => i.put(apiPaths.adminVocabulary.word(userLoginId, courseId, lessonId, wordId), word));

/** Words from any lesson of the course. */
export const deleteAdminUserWords = ({
    userLoginId,
    courseId,
    wordIds,
}: CourseRef & { wordIds: string[] }): Promise<{ count: number }> =>
    request((i) => i.post(apiPaths.adminVocabulary.deleteWords(userLoginId, courseId), { wordIds }));
