import { apiPaths } from "@/lib/api-paths";
import { request } from "@/lib/axios";
import { localDateString } from "@/lib/daily-habit";
import {
    IBulkRecordAnswersDto,
    IBulkRecordAnswersResponse,
    IDueWordIdsResponse,
    ILeechesResponse,
    IWordProgressResponse,
    IWordProgressStats,
    LeechScope,
    WordProgressScope
} from "@/types/word-progress/word-progress.type";

/**
 * Scope-selecting endpoints are POSTs with a body, not GETs with query params.
 *
 * The GET shape belonged to the gateway, which resolved the scope to a word-id
 * list and POSTed that to learning-service. Now that the request reaches
 * learning-service directly, it takes the service's own contract: either an
 * explicit `wordIds` list or a `courseId`/`lessonId` for the server to resolve.
 */

/** Record multiple answers synchronously (writes to DB directly). */
export const recordAnswerBulkSync = (
    data: IBulkRecordAnswersDto,
): Promise<IBulkRecordAnswersResponse> =>
    request((i) => i.post(apiPaths.wordProgress.recordAnswerBulkSync(), data));

export const getDueWordIds = (
    { courseId, lessonId, limit, newLimit, includeNew }: WordProgressScope = {},
): Promise<IDueWordIdsResponse> =>
    request((i) => i.post(apiPaths.wordProgress.dueWordIds(), {
        courseId,
        lessonId,
        limit,
        newLimit,
        includeNew,
        // The learner's local day drives daily-pacing limits, not the server's.
        clientDate: localDateString(),
    }));

/**
 * Due words within an explicit id list.
 *
 * Passing the ids outright rather than a scope matters offline: the client
 * already holds the pool it cached, and a server-side scope lookup could return
 * words it has no local copy of.
 */
export const getDueWordIdsByWordIds = (
    wordIds: string[],
    limit?: number,
    includeNew?: boolean,
    newLimit?: number,
): Promise<IDueWordIdsResponse> =>
    request((i) => i.post(apiPaths.wordProgress.dueWordIds(), {
        wordIds,
        limit,
        newLimit,
        includeNew,
        clientDate: localDateString(),
    }));

export const getProgressStats = (
    { courseId, lessonId }: Pick<WordProgressScope, "courseId" | "lessonId"> = {},
): Promise<IWordProgressStats> =>
    request((i) => i.post(apiPaths.wordProgress.stats(), { courseId, lessonId }));

export const getProgressStatsByWordIds = (
    wordIds: string[],
): Promise<IWordProgressStats> =>
    request((i) => i.post(apiPaths.wordProgress.stats(), { wordIds }));

export const getWordProgress = (wordId: string): Promise<IWordProgressResponse | null> =>
    request((i) => i.get(apiPaths.wordProgress.word(wordId)));

export const resetProgress = (wordId: string): Promise<{ success: boolean }> =>
    request((i) => i.delete(apiPaths.wordProgress.resetWord(wordId)));

export const getProgressStatsByCourseIds = (
    courseIds: string[],
): Promise<Record<string, IWordProgressStats>> =>
    request((i) => i.post(apiPaths.wordProgress.statsByCourseIds(), { courseIds }));

export const getProgressStatsByLessonIds = (
    lessonIds: string[],
): Promise<Record<string, IWordProgressStats>> =>
    request((i) => i.post(apiPaths.wordProgress.statsByLessonIds(), { lessonIds }));

export const getProgressByWordIds = (
    wordIds: string[],
): Promise<Record<string, IWordProgressResponse | null>> =>
    request((i) => i.post(apiPaths.wordProgress.byWordIds(), { wordIds }));

/** List leech (repeatedly-failed / suspended) words, optionally scoped. */
export const getLeeches = (
    { courseId, lessonId }: LeechScope = {},
): Promise<ILeechesResponse> =>
    request((i) => i.post(apiPaths.wordProgress.leeches(), { courseId, lessonId }));

/** Lift the auto-suspension on a leech word so it re-enters the review queue. */
export const unsuspendWord = (wordId: string): Promise<{ success: boolean }> =>
    request((i) => i.post(apiPaths.wordProgress.unsuspendWord(wordId)));
