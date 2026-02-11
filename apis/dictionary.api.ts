import axiosInstance from "@/lib/axios";
import { IWordPronunciation } from "@/types/courses/courses.type";
import { AxiosError } from "axios";
import { IWordSearchResult } from "@/types/courses/courses.type";

export const fetchWordDetailsDictionary = async (word: string): Promise<IWordPronunciation[]> => {
    try {
        const response = await axiosInstance.get<IWordPronunciation[]>(`/dictionary/pronunciation/${word}`);
        const seen = new Set<string>();
        return response.data.filter((p) => {
            if (seen.has(p.url)) return false;
            seen.add(p.url);
            return true;
        });
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}

export const searchWords = async (query: string): Promise<IWordSearchResult[]> => {
    try {
        const response = await axiosInstance.get<IWordSearchResult[]>(`/dictionary/search/${query}`);
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}