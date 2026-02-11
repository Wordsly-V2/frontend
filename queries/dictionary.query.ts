import { fetchWordDetailsDictionary, searchWords } from "@/apis/dictionary.api";
import { useQuery } from "@tanstack/react-query";

export const useFetchWordDetailsDictionaryQuery = (word: string, enabled: boolean = true) => useQuery({
    queryKey: ['words', 'pronunciation', word],
    queryFn: () => fetchWordDetailsDictionary(word),
    enabled,
});

export const useSearchWordsQuery = (query: string, enabled: boolean = true) => useQuery({
    queryKey: ['words', 'search', query],
    queryFn: () => searchWords(query),
    enabled,
});

