import { getWordsByIds, getWordsByIdsAllCourses, searchMyWords } from "@/apis/words.api";
import { IUserWordSearchResult, IWord } from "@/types/courses/courses.type";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetch full word details by ID. With a courseId the fetch is course-scoped;
 * without one it spans all the user's courses (for all-courses review sessions).
 */
export const useGetWordsByIdsQuery = (courseId: string | undefined, wordIds: string[] = [], enabled: boolean = true) => useQuery<IWord[]>({
    queryKey: ['words', 'get', courseId || 'all', [...wordIds].sort()],
    queryFn: () => courseId ? getWordsByIds(courseId, wordIds) : getWordsByIdsAllCourses(wordIds),
    enabled,
});

export const useSearchMyWordsQuery = (word: string, enabled: boolean) =>
    useQuery<IUserWordSearchResult[]>({
        queryKey: ['my-words', 'search', word],
        queryFn: () => searchMyWords(word),
        enabled: enabled && word.trim().length > 0,
    });
