import { apiPaths } from "@/lib/api-paths";
import { request } from "@/lib/axios";
import type { IPaginatedResponse } from "@/types/common/pagination.type";
import type { CreateMyLesson, CreateMyWord, CreateUpdateMyCourse, ICourse, ILesson, IWord } from "@/types/courses/courses.type";
import type {
    AdminOfficialCoursesQuery,
    OfficialCourse,
    OfficialCourseSummary,
} from "@/types/official-courses/official-courses.type";

/**
 * Authoring official courses (admins only). Learners only ever get copies, so
 * nothing here touches a learner's own courses or their review progress.
 */

const paths = apiPaths.adminOfficialCourses;

export const getAdminOfficialCourses = (query: AdminOfficialCoursesQuery): Promise<IPaginatedResponse<OfficialCourseSummary>> =>
    request((i) => i.get(paths.root(), { params: query }));

export const getAdminOfficialCourse = (courseId: string): Promise<OfficialCourse> =>
    request((i) => i.get(paths.course(courseId)));

/** New courses start as drafts. */
export const createOfficialCourse = (course: CreateUpdateMyCourse): Promise<ICourse> =>
    request((i) => i.post(paths.root(), course));

export const updateOfficialCourse = ({ courseId, course }: { courseId: string; course: CreateUpdateMyCourse }): Promise<ICourse> =>
    request((i) => i.put(paths.course(courseId), course));

/** Learners' copies stay. */
export const deleteOfficialCourse = ({ courseId }: { courseId: string }): Promise<{ success: true }> =>
    request((i) => i.delete(paths.course(courseId)));

/** Publishing a course without words answers 400. */
export const setOfficialCoursePublished = ({ courseId, published }: { courseId: string; published: boolean }): Promise<ICourse> =>
    request((i) => i.post(published ? paths.publish(courseId) : paths.unpublish(courseId)));

export const createOfficialLesson = ({ courseId, lesson }: { courseId: string; lesson: CreateMyLesson }): Promise<ILesson> =>
    request((i) => i.post(paths.lessons(courseId), lesson));

export const updateOfficialLesson = ({
    courseId,
    lessonId,
    lesson,
}: {
    courseId: string;
    lessonId: string;
    lesson: CreateMyLesson;
}): Promise<ILesson> => request((i) => i.put(paths.lesson(courseId, lessonId), lesson));

export const deleteOfficialLesson = ({ courseId, lessonId }: { courseId: string; lessonId: string }): Promise<{ success: true }> =>
    request((i) => i.delete(paths.lesson(courseId, lessonId)));

export const createOfficialWord = ({
    courseId,
    lessonId,
    word,
}: {
    courseId: string;
    lessonId: string;
    word: CreateMyWord;
}): Promise<IWord> => request((i) => i.post(paths.words(courseId, lessonId), word));

export const updateOfficialWord = ({
    courseId,
    lessonId,
    wordId,
    word,
}: {
    courseId: string;
    lessonId: string;
    wordId: string;
    word: CreateMyWord;
}): Promise<IWord> => request((i) => i.put(paths.word(courseId, lessonId, wordId), word));

/** Words from any lesson of the course. */
export const deleteOfficialWords = ({ courseId, wordIds }: { courseId: string; wordIds: string[] }): Promise<{ count: number }> =>
    request((i) => i.post(paths.deleteWords(courseId), { wordIds }));
