import { request } from "@/lib/axios";
import { localDateString } from "@/lib/daily-habit";
import {
    IBulkRecordAnswersDto,
    IBulkRecordAnswersResponse,
    IDueWord,
    IDueWordIdsResponse,
    ILeechesResponse,
    IWordProgressResponse,
    IWordProgressStats,
    LeechScope,
    WordProgressScope
} from "@/types/word-progress/word-progress.type";

/** Record multiple answers synchronously (writes to DB directly). */
export const recordAnswerBulkSync = (
    data: IBulkRecordAnswersDto,
): Promise<IBulkRecordAnswersResponse> =>
    request((i) => i.post("/word-progress/record-answer/bulk-sync", data));

export const getDueWords = (
    { courseId, lessonId, limit, includeNew }: WordProgressScope = {},
): Promise<IDueWord[]> =>
    request((i) => i.get('/word-progress/due-words', {
        params: { courseId, lessonId, limit, includeNew: includeNew?.toString() },
    }));

export const getDueWordIds = (
    { courseId, lessonId, limit, includeNew }: WordProgressScope = {},
): Promise<IDueWordIdsResponse> =>
    request((i) => i.get('/word-progress/due-word-ids', {
        params: {
            courseId,
            lessonId,
            limit,
            includeNew: includeNew?.toString(),
            // The learner's local day drives daily-pacing limits, not the server's.
            clientDate: localDateString(),
        },
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
): Promise<IDueWordIdsResponse> =>
    request((i) => i.post('/word-progress/due-word-ids/by-word-ids', {
        wordIds,
        limit,
        includeNew,
        clientDate: localDateString(),
    }));

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

/** List leech (repeatedly-failed / suspended) words, optionally scoped. */
export const getLeeches = (
    { courseId, lessonId }: LeechScope = {},
): Promise<ILeechesResponse> =>
    request((i) => i.get('/word-progress/leeches', {
        params: { courseId, lessonId },
    }));

/** Lift the auto-suspension on a leech word so it re-enters the review queue. */
export const unsuspendWord = (wordId: string): Promise<{ success: boolean }> =>
    request((i) => i.post(`/word-progress/words/${wordId}/unsuspend`));
