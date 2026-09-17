import { listSavedWords, saveWord, unsaveWord } from "@/apis/saved-words.api";
import { isNetworkError } from "@/lib/api-error";
import {
    enqueueSyncRecord,
    newClientRequestId,
} from "@/lib/offline/sync-queue";
import { queryKeys } from "@/lib/query-keys";
import type {
    ISavedWord,
    ISavedWordsResponse,
    SavedWordsScope,
} from "@/types/saved-words/saved-words.type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetSavedWordsQuery = (
    scope: SavedWordsScope = {},
    enabled: boolean = true,
) =>
    useQuery<ISavedWordsResponse>({
        queryKey: queryKeys.savedWords.list(scope.courseId, scope.lessonId),
        queryFn: () => listSavedWords(scope),
        enabled,
    });

export interface ToggleSavedWordVars {
    wordId: string;
    /** The state to move TO. */
    saved: boolean;
    note?: string;
}

/**
 * Flag or unflag a word as difficult.
 *
 * Optimistic, because this is a button pressed mid-practice and a round trip's
 * worth of lag reads as a dead control. Offline it queues instead of failing:
 * the word the learner just struggled with is exactly the one they are most
 * likely to flag on a train, and both directions are idempotent server-side, so
 * the queued record is safe to resend.
 */
export const useToggleSavedWordMutation = (
    scope: SavedWordsScope = {},
    userLoginId?: string | null,
) => {
    const queryClient = useQueryClient();
    const queryKey = queryKeys.savedWords.list(scope.courseId, scope.lessonId);

    return useMutation<void, Error, ToggleSavedWordVars, { previous?: ISavedWordsResponse }>({
        mutationFn: async ({ wordId, saved, note }) => {
            try {
                if (saved) {
                    await saveWord({ wordId, note });
                } else {
                    await unsaveWord(wordId);
                }
            } catch (error) {
                if (!isNetworkError(error) || !userLoginId) throw error;
                await enqueueSyncRecord({
                    userLoginId,
                    clientRequestId: newClientRequestId(),
                    op: { kind: "saved-word", body: { wordId, note, saved } },
                });
            }
        },
        onMutate: async ({ wordId, saved, note }) => {
            await queryClient.cancelQueries({ queryKey });
            const previous =
                queryClient.getQueryData<ISavedWordsResponse>(queryKey);

            queryClient.setQueryData<ISavedWordsResponse>(queryKey, (current) => {
                const savedWords = current?.savedWords ?? [];
                if (!saved) {
                    return {
                        savedWords: savedWords.filter(
                            (word) => word.wordId !== wordId,
                        ),
                    };
                }
                if (savedWords.some((word) => word.wordId === wordId)) {
                    return {
                        savedWords: savedWords.map((word) =>
                            word.wordId === wordId ? { ...word, note } : word,
                        ),
                    };
                }
                // A placeholder row: the progress columns are filled in by the
                // refetch below. Newest-first, matching the server's order.
                const placeholder: ISavedWord = {
                    wordId,
                    note,
                    savedAt: new Date().toISOString(),
                    nextReviewAt: null,
                    successRate: 0,
                    totalReviews: 0,
                    isLeech: false,
                    isSettled: false,
                };
                return { savedWords: [placeholder, ...savedWords] };
            });

            return { previous };
        },
        onError: (_error, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(queryKey, context.previous);
            }
        },
        // Every scope's list is refetched, not just this one: the same word can
        // appear in the all-courses list and its own course's list at once.
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.savedWords.all });
        },
    });
};
