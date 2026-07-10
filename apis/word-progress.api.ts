import { request } from "@/lib/axios";
import {
    IBulkRecordAnswersDto,
    IDueWord,
    IWordProgressResponse,
    IWordProgressStats,
    WordProgressScope
} from "@/types/word-progress/word-progress.type";

/** Record multiple answers synchronously (writes to DB directly). */
export const recordAnswerBulkSync = (
    data: IBulkRecordAnswersDto,
): Promise<IWordProgressResponse[]> =>
    request((i) => i.post("/word-progress/record-answer/bulk-sync", data));

export const getDueWords = (
    { courseId, lessonId, limit, includeNew }: WordProgressScope = {},
): Promise<IDueWord[]> =>
    request((i) => i.get('/word-progress/due-words', {
        params: { courseId, lessonId, limit, includeNew: includeNew?.toString() },
    }));

export const getDueWordIds = (
    { courseId, lessonId, limit, includeNew }: WordProgressScope = {},
): Promise<{ wordIds: string[] }> =>
    request((i) => i.get('/word-progress/due-word-ids', {
        params: { courseId, lessonId, limit, includeNew: includeNew?.toString() },
    }));

export const getProgressStats = (
    { courseId, lessonId }: Pick<WordProgressScope, "courseId" | "lessonId"> = {},
): Promise<IWordProgressStats> =>
    request((i) => i.get('/word-progress/stats', {
        params: { courseId, lessonId },
    }));

export const getProgressStatsByWordIds = (
    wordIds: string[],
): Promise<IWordProgressStats> =>
    request((i) => i.post('/word-progress/stats', { wordIds }));

export const getDueWordIdsByWordIds = (
    wordIds: string[],
    limit?: number,
    includeNew?: boolean,
): Promise<{ wordIds: string[] }> =>
    request((i) => i.post('/word-progress/due-word-ids/by-word-ids', { wordIds, limit, includeNew }));

export const getWordProgress = (wordId: string): Promise<IWordProgressResponse | null> =>
    request((i) => i.get(`/word-progress/words/${wordId}`));

export const resetProgress = (wordId: string): Promise<{ success: boolean }> =>
    request((i) => i.delete(`/word-progress/words/${wordId}/reset`));

export const getProgressStatsByCourseIds = (
    courseIds: string[],
): Promise<Record<string, IWordProgressStats>> =>
    request((i) => i.post('/word-progress/stats/by-course-ids', { courseIds }));

export const getProgressStatsByLessonIds = (
    lessonIds: string[],
): Promise<Record<string, IWordProgressStats>> =>
    request((i) => i.post('/word-progress/stats/by-lesson-ids', { lessonIds }));

export const getProgressByWordIds = (
    wordIds: string[],
): Promise<Record<string, IWordProgressResponse | null>> =>
    request((i) => i.post('/word-progress/by-word-ids', { wordIds }));
