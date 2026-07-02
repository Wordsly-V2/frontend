import { request } from "@/lib/axios";
import { CreateMyWord, IUserWordSearchResult, IWord } from "@/types/courses/courses.type";

export const createMyWordsBulk = (
    courseId: string,
    lessonId: string,
    words: CreateMyWord[]
): Promise<{ success: boolean; count?: number }> =>
    request((i) =>
        i.post(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words/bulk`, { words })
    );

export const searchMyWords = (word: string): Promise<IUserWordSearchResult[]> =>
    request((i) => i.get(`/dictionary/my-words/search/${encodeURIComponent(word.trim())}`));

export const createMyWord = (courseId: string, lessonId: string, word: CreateMyWord): Promise<{ success: boolean }> =>
    request((i) => i.post(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words`, word));

export const updateMyWord = (courseId: string, lessonId: string, wordId: string, word: CreateMyWord): Promise<{ success: boolean }> =>
    request((i) => i.put(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words/${wordId}`, word));

export const deleteMyWord = (courseId: string, lessonId: string, wordId: string): Promise<{ success: boolean }> =>
    request((i) => i.delete(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words/${wordId}`));

export const moveMyWord = (
    courseId: string,
    lessonId: string,
    wordId: string,
    targetLessonId: string,
    targetCourseId?: string
): Promise<{ success: boolean }> => {
    const body = targetCourseId ? { targetLessonId, targetCourseId } : { targetLessonId };
    return request((i) => i.put(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words/${wordId}/move`, body));
};

export const bulkDeleteMyWords = (courseId: string, lessonId: string, wordIds: string[]): Promise<{ success: boolean }> =>
    request((i) => i.delete(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words/bulk-delete`, { data: { wordIds } }));

export const bulkMoveMyWords = (
    courseId: string,
    lessonId: string,
    wordIds: string[],
    targetLessonId: string,
    targetCourseId?: string
): Promise<{ success: boolean }> => {
    const body = targetCourseId ? { wordIds, targetLessonId, targetCourseId } : { wordIds, targetLessonId };
    return request((i) => i.put(`/courses/me/my-courses/${courseId}/lessons/${lessonId}/words/bulk-move`, body));
};

/** Delete multiple words from a course (words can be from any lesson). */
export const bulkDeleteMyWordsFromCourse = (courseId: string, wordIds: string[]): Promise<{ count: number }> =>
    request((i) => i.delete(`/courses/me/my-courses/${courseId}/words/bulk-delete`, { data: { wordIds } }));

/** Move multiple words to a target lesson (words can be from any lesson in the course; target can be in another course). */
export const bulkMoveMyWordsFromCourse = (
    courseId: string,
    wordIds: string[],
    targetLessonId: string
): Promise<{ count: number }> =>
    request((i) => i.put(`/courses/me/my-courses/${courseId}/words/bulk-move`, { wordIds, targetLessonId }));

export const getWordsByIds = (courseId: string, wordIds: string[]): Promise<IWord[]> =>
    request((i) => i.get(`/courses/me/my-courses/${courseId}/words`, { params: { ids: wordIds.join(",") } }));

/** Hydrate words by ID across all of the user's courses (ownership-scoped). */
export const getWordsByIdsAllCourses = (wordIds: string[]): Promise<IWord[]> =>
    request((i) => i.get(`/courses/me/my-words`, { params: { ids: wordIds.join(",") } }));
