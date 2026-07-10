import { request } from "@/lib/axios";
import { IWordPronunciation } from "@/types/courses/courses.type";
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
    return request((i) => i.get(`/dictionary/search/${encodeURIComponent(query.trim())}`));
};

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

export const getLangeekWordDetails = (
    word: string,
    partOfSpeech: string
): Promise<LangeekWordDetailsResponse | null> =>
    request<LangeekWordDetailsResponse | null>(
        (i) =>
            i.get(
                `/dictionary/word-details/${encodeURIComponent(word.trim())}/${encodeURIComponent(partOfSpeech.trim())}`,
            ),
        { notFoundAsNull: true },
    );
