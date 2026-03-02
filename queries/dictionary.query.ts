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
    word: string,
    partOfSpeech: string,
    enabled: boolean
) =>
    useQuery({
        queryKey: ['words', 'langeek-details', word, partOfSpeech],
        queryFn: () => getLangeekWordDetails(word, partOfSpeech),
        enabled: enabled && word.trim().length > 0 && partOfSpeech.trim().length > 0,
    });