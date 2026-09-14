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
        staleTime: DICTIONARY_STALE_TIME,
    });

/**
 * Dictionary content is effectively static — the service caches it for a week —
 * so the global 60s `staleTime` only bought a refetch (and its latency) every
 * time a learner reopened search for a word they just looked up.
 */
const DICTIONARY_STALE_TIME = 24 * 60 * 60 * 1000;

export const useSearchWordsQuery = (query: string, enabled: boolean = true) => useQuery({
    queryKey: queryKeys.dictionary.search(query),
    queryFn: () => searchWords(query),
    enabled,
    staleTime: DICTIONARY_STALE_TIME,
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
        staleTime: DICTIONARY_STALE_TIME,
    });
