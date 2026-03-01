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
    partOfSpeech: string,
    enabled: boolean
) =>
    useQuery({
        queryKey: ['words', 'langeek-details', langeekWordId, partOfSpeech],
        queryFn: () => getLangeekWordDetails(langeekWordId!, partOfSpeech),
        enabled: enabled && langeekWordId != null && partOfSpeech.trim().length > 0,
    });