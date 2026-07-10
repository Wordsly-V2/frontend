import {
    fetchWordDetailsDictionary,
    getLangeekWordDetails,
    searchWords,
} from "@/apis/dictionary.api";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

export const useFetchWordDetailsDictionaryQuery = (word: string, enabled: boolean = true) =>
    useQuery({
        queryKey: queryKeys.dictionary.pronunciation(word),
        queryFn: () => fetchWordDetailsDictionary(word),
        enabled,
    });

export const useSearchWordsQuery = (query: string, enabled: boolean = true) => useQuery({
    queryKey: queryKeys.dictionary.search(query),
    queryFn: () => searchWords(query),
    enabled,
});

export const useLangeekWordDetailsQuery = (
    word: string,
    partOfSpeech: string,
    enabled: boolean
) =>
    useQuery({
        queryKey: queryKeys.dictionary.langeekDetails(word, partOfSpeech),
        queryFn: () => getLangeekWordDetails(word, partOfSpeech),
        enabled: enabled && word.trim().length > 0 && partOfSpeech.trim().length > 0,
    });
