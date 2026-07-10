import {
    bulkDeleteMyWords,
    bulkDeleteMyWordsFromCourse,
    bulkMoveMyWords,
    bulkMoveMyWordsFromCourse,
    createMyWord,
    createMyWordsBulk,
    deleteMyWord,
    getWordsByIds,
    getWordsByIdsAllCourses,
    moveMyWord,
    searchMyWords,
    updateMyWord,
} from "@/apis/words.api";
import { queryKeys } from "@/lib/query-keys";
import { CreateMyWord, IUserWordSearchResult, IWord } from "@/types/courses/courses.type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Fetch full word details by ID. With a courseId the fetch is course-scoped;
 * without one it spans all the user's courses (for all-courses review sessions).
 */
export const useGetWordsByIdsQuery = (courseId: string | undefined, wordIds: string[] = [], enabled: boolean = true) =>
    useQuery<IWord[]>({
        queryKey: queryKeys.words.byIds(courseId, wordIds),
        queryFn: () => (courseId ? getWordsByIds(courseId, wordIds) : getWordsByIdsAllCourses(wordIds)),
        enabled,
    });

export const useSearchMyWordsQuery = (word: string, enabled: boolean) =>
    useQuery<IUserWordSearchResult[]>({
        queryKey: queryKeys.myWords.search(word),
        queryFn: () => searchMyWords(word),
        enabled: enabled && word.trim().length > 0,
    });

/**
 * All word mutations change the parent course's word lists and counts, so they
 * invalidate the `courses` root (which the manage screen reads for detail).
 */
function useWordMutation<TArgs, TData>(mutationFn: (args: TArgs) => Promise<TData>) {
    const queryClient = useQueryClient();
    return useMutation<TData, Error, TArgs>({
        mutationFn,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
    });
}

export const useCreateMyWordMutation = () =>
    useWordMutation(({ courseId, lessonId, word }: { courseId: string; lessonId: string; word: CreateMyWord }) =>
        createMyWord(courseId, lessonId, word));

export const useUpdateMyWordMutation = () =>
    useWordMutation(({ courseId, lessonId, wordId, word }: { courseId: string; lessonId: string; wordId: string; word: CreateMyWord }) =>
        updateMyWord(courseId, lessonId, wordId, word));

export const useDeleteMyWordMutation = () =>
    useWordMutation(({ courseId, lessonId, wordId }: { courseId: string; lessonId: string; wordId: string }) =>
        deleteMyWord(courseId, lessonId, wordId));

export const useMoveMyWordMutation = () =>
    useWordMutation(({ courseId, lessonId, wordId, targetLessonId, targetCourseId }: { courseId: string; lessonId: string; wordId: string; targetLessonId: string; targetCourseId?: string }) =>
        moveMyWord(courseId, lessonId, wordId, targetLessonId, targetCourseId));

export const useCreateMyWordsBulkMutation = () =>
    useWordMutation(({ courseId, lessonId, words }: { courseId: string; lessonId: string; words: CreateMyWord[] }) =>
        createMyWordsBulk(courseId, lessonId, words));

export const useBulkDeleteMyWordsMutation = () =>
    useWordMutation(({ courseId, lessonId, wordIds }: { courseId: string; lessonId: string; wordIds: string[] }) =>
        bulkDeleteMyWords(courseId, lessonId, wordIds));

export const useBulkMoveMyWordsMutation = () =>
    useWordMutation(({ courseId, lessonId, wordIds, targetLessonId, targetCourseId }: { courseId: string; lessonId: string; wordIds: string[]; targetLessonId: string; targetCourseId?: string }) =>
        bulkMoveMyWords(courseId, lessonId, wordIds, targetLessonId, targetCourseId));

export const useBulkDeleteMyWordsFromCourseMutation = () =>
    useWordMutation(({ courseId, wordIds }: { courseId: string; wordIds: string[] }) =>
        bulkDeleteMyWordsFromCourse(courseId, wordIds));

export const useBulkMoveMyWordsFromCourseMutation = () =>
    useWordMutation(({ courseId, wordIds, targetLessonId }: { courseId: string; wordIds: string[]; targetLessonId: string }) =>
        bulkMoveMyWordsFromCourse(courseId, wordIds, targetLessonId));
