import { getWordsByIds, searchMyWords } from "@/apis/words.api";
import { IUserWordSearchResult, IWord } from "@/types/courses/courses.type";
import { useQuery } from "@tanstack/react-query";

export const useGetWordsByIdsQuery = (courseId: string, wordIds: string[] = [], enabled: boolean = true) => useQuery<IWord[]>({
    queryKey: ['words', 'get', courseId, wordIds],
    queryFn: () => getWordsByIds(courseId, wordIds),
    enabled,
});

export const useSearchMyWordsQuery = (word: string, enabled: boolean) =>
    useQuery<IUserWordSearchResult[]>({
        queryKey: ['my-words', 'search', word],
        queryFn: () => searchMyWords(word),
        enabled: enabled && word.trim().length > 0,
    });
