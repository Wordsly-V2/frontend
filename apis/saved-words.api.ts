import { apiPaths } from "@/lib/api-paths";
import { request } from "@/lib/axios";
import type {
    ISaveWordDto,
    ISavedWordsResponse,
    SavedWordsScope,
} from "@/types/saved-words/saved-words.type";

/**
 * Flag a word as hard. Idempotent server-side, so the UI can treat the control
 * as a plain toggle and a retried offline queue entry is harmless.
 */
export const saveWord = (data: ISaveWordDto): Promise<{ success: boolean }> =>
    request((i) => i.post(apiPaths.savedWords.root(), data));

export const unsaveWord = (wordId: string): Promise<{ success: boolean }> =>
    request((i) => i.delete(apiPaths.savedWords.byId(wordId)));

/**
 * A POST with a body rather than a GET, for the same reason the word-progress
 * reads are: the scope can be a long id list.
 */
export const listSavedWords = (
    { courseId, lessonId, wordIds }: SavedWordsScope = {},
): Promise<ISavedWordsResponse> =>
    request((i) =>
        i.post(apiPaths.savedWords.list(), { courseId, lessonId, wordIds }),
    );
