import {
    fetchWordDetailsDictionary,
    getLangeekWordDetails,
    getWordExamples,
    searchWords,
} from "@/apis/dictionary.api";
import { useQuery } from "@tanstack/react-query";

export const useFetchWordDetailsDictionaryQuery = (word: string, enabled: boolean = true) =>
    useQuery({
        queryKey: ['words', 'pronunciation', word],
        queryFn: () => fetchWordDetailsDictionary(word),
        enabled,
    });

export const useSearchWordsQuery = (query: string, enabled: boolean = true) => useQuery({
    queryKey: ['words', 'search', query],
    queryFn: () => searchWords(query),
    enabled,
});

export const useGetWordExamplesQuery = (word: string, enabled: boolean = true) => useQuery({
    queryKey: ['words', 'examples', word],
    queryFn: () => getWordExamples(word),
    enabled,
});

export const useLangeekWordDetailsQuery = (
    langeekWordId: number | null,
    entry: string,
    enabled: boolean
) =>
    useQuery({
        queryKey: ['words', 'langeek-details', langeekWordId, entry],
        queryFn: () => getLangeekWordDetails(langeekWordId!, entry),
        enabled: enabled && langeekWordId != null && entry.trim().length > 0,
    });