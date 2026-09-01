import { apiPaths } from "@/lib/api-paths";
import { request } from "@/lib/axios";
import { CreateMyWord, IUserWordSearchResult, IWord } from "@/types/courses/courses.type";

export const createMyWordsBulk = (
    courseId: string,
    lessonId: string,
    words: CreateMyWord[]
): Promise<{ success: boolean; count?: number }> =>
    // Wrapped in `{ words }` because vocabulary-service's DTO takes an object.
    // The gateway used to do this re-wrapping; it no longer inspects bodies.
    request((i) =>
        i.post(apiPaths.lessonWords.bulk(courseId, lessonId), { words })
    );

export const searchMyWords = (word: string): Promise<IUserWordSearchResult[]> =>
    request((i) => i.get(apiPaths.dictionary.searchMyWords(word.trim())));

export const createMyWord = (courseId: string, lessonId: string, word: CreateMyWord): Promise<{ success: boolean }> =>
    request((i) => i.post(apiPaths.lessonWords.root(courseId, lessonId), word));

export const updateMyWord = (courseId: string, lessonId: string, wordId: string, word: CreateMyWord): Promise<{ success: boolean }> =>
    request((i) => i.put(apiPaths.lessonWords.byId(courseId, lessonId, wordId), word));

export const deleteMyWord = (courseId: string, lessonId: string, wordId: string): Promise<{ success: boolean }> =>
    request((i) => i.delete(apiPaths.lessonWords.byId(courseId, lessonId, wordId)));

export const moveMyWord = (
    courseId: string,
    lessonId: string,
    wordId: string,
    targetLessonId: string,
    targetCourseId?: string
): Promise<{ success: boolean }> => {
    const body = targetCourseId ? { targetLessonId, targetCourseId } : { targetLessonId };
    return request((i) => i.put(apiPaths.lessonWords.move(courseId, lessonId, wordId), body));
};

export const bulkDeleteMyWords = (courseId: string, lessonId: string, wordIds: string[]): Promise<{ success: boolean }> =>
    request((i) => i.delete(apiPaths.lessonWords.bulkDelete(courseId, lessonId), { data: { wordIds } }));

export const bulkMoveMyWords = (
    courseId: string,
    lessonId: string,
    wordIds: string[],
    targetLessonId: string,
    targetCourseId?: string
): Promise<{ success: boolean }> => {
    const body = targetCourseId ? { wordIds, targetLessonId, targetCourseId } : { wordIds, targetLessonId };
    return request((i) => i.put(apiPaths.lessonWords.bulkMove(courseId, lessonId), body));
};

/** Delete multiple words from a course (words can be from any lesson). */
export const bulkDeleteMyWordsFromCourse = (courseId: string, wordIds: string[]): Promise<{ count: number }> =>
    request((i) => i.delete(apiPaths.courses.wordsBulkDelete(courseId), { data: { wordIds } }));

/** Move multiple words to a target lesson (words can be from any lesson in the course; target can be in another course). */
export const bulkMoveMyWordsFromCourse = (
    courseId: string,
    wordIds: string[],
    targetLessonId: string
): Promise<{ count: number }> =>
    request((i) => i.put(apiPaths.courses.wordsBulkMove(courseId), { wordIds, targetLessonId }));

export const getWordsByIds = (courseId: string, wordIds: string[]): Promise<IWord[]> =>
    request((i) => i.get(apiPaths.courses.words(courseId), { params: { ids: wordIds.join(",") } }));

/**
 * Hydrate words by ID across all of the user's courses (ownership-scoped).
 *
 * A POST with a body: the comma-joined `?ids=` query string was the gateway's
 * own shape, and it had a length ceiling a long practice session could reach.
 */
export const getWordsByIdsAllCourses = (wordIds: string[]): Promise<IWord[]> =>
    request((i) => i.post(apiPaths.words.hydrateByIds(), { wordIds }));
