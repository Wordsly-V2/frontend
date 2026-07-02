import axiosInstance, { request } from "@/lib/axios";
import { IWordPronunciation } from "@/types/courses/courses.type";
import { AxiosError } from "axios";
import { IWordSearchResult } from "@/types/courses/courses.type";

export type IpaByPos = {
    partOfSpeech: string;
    uk: string | null;
    us: string | null;
};

export type WordPronunciationResponse = {
    pronunciation: IWordPronunciation[];
    ipas: IpaByPos[];
};

export const fetchWordDetailsDictionary = async (word: string): Promise<WordPronunciationResponse> => {
    const data = await request<WordPronunciationResponse>((i) =>
        i.get(`/dictionary/pronunciation/${encodeURIComponent(word.trim())}`)
    );
    const seen = new Set<string>();
    const pronunciation = (data.pronunciation ?? []).filter((p) => {
        if (seen.has(p.url)) return false;
        seen.add(p.url);
        return true;
    });
    return {
        pronunciation,
        ipas: Array.isArray(data.ipas) ? data.ipas : [],
    };
};

export const searchWords = (query: string): Promise<IWordSearchResult[]> => {
    if (query.trim().length === 0) return Promise.resolve([]);
    return request((i) => i.get(`/dictionary/search/${query}`));
};

export const getWordExamples = (word: string): Promise<string[]> =>
    request((i) => i.get(`/dictionary/examples/${word}`));

/** Structured word details from GET word-details (extracted in vocabulary-service). */
export interface LangeekWordDetailsResponse {
    word: string;
    meaning: string;
    partOfSpeech: string;
    pronunciation: string;
    audioUrl: string;
    examples: string[];
    imageUrl: string;
}

export const getLangeekWordDetails = async (
    word: string,
    partOfSpeech: string
): Promise<LangeekWordDetailsResponse | null> => {
    try {
        const response = await axiosInstance.get<LangeekWordDetailsResponse | null>(
            `/dictionary/word-details/${encodeURIComponent(word)}/${partOfSpeech}`
        );
        return response.data;
    } catch (error) {
        if ((error as AxiosError).response?.status === 404) return null;
        throw (error as AxiosError).response?.data || error;
    }
};
