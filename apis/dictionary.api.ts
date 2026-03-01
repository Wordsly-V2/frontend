import axiosInstance from "@/lib/axios";
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
    try {
        const response = await axiosInstance.get<WordPronunciationResponse>(
            `/dictionary/pronunciation/${encodeURIComponent(word.trim())}`
        );
        const data = response.data;
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
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};

export const searchWords = async (query: string): Promise<IWordSearchResult[]> => {
    try {
        const response = await axiosInstance.get<IWordSearchResult[]>(`/dictionary/search/${query}`);
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

export const getWordExamples = async (word: string): Promise<string[]> => {
    try {
        const response = await axiosInstance.get<string[]>(`/dictionary/examples/${word}`);
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};

/** Structured word details from GET word-details (extracted in vocabulary-service). */
export interface LangeekWordDetailsResponse {
    word: string;
    meaning: string;
    partOfSpeech: string;
    pronunciation: string;
    audioUrl: string;
    examples: string[];
}

export const getLangeekWordDetails = async (
    langeekWordId: number,
    entry: string
): Promise<LangeekWordDetailsResponse | null> => {
    try {
        const params = new URLSearchParams({ entry: entry.trim() });
        const response = await axiosInstance.get<LangeekWordDetailsResponse | null>(
            `/dictionary/word-details/${langeekWordId}?${params}`
        );
        return response.data;
    } catch (error) {
        if ((error as AxiosError).response?.status === 404) return null;
        throw (error as AxiosError).response?.data || error;
    }
};
