import { getLocalStorageItem } from "@/lib/local-storage";

/**
 * Shared "due words batch" limit for Learn (course page + quick actions).
 * Persisted in localStorage by the course page; read everywhere else.
 */
export const DUE_WORDS_LIMIT_OPTIONS = [5, 10, 15, 20] as const;

export const DUE_WORDS_LIMIT_STORAGE_KEY = "wordsly-learn-due-words-limit";

export const DEFAULT_DUE_WORDS_LIMIT = 20;

export function parseDueWordsLimit(raw: string | null, initial: number): number {
    if (raw === null) return initial;
    const parsed = Number(raw);
    return DUE_WORDS_LIMIT_OPTIONS.includes(parsed as (typeof DUE_WORDS_LIMIT_OPTIONS)[number])
        ? parsed
        : initial;
}

/** Read persisted limit synchronously on the client (safe for SSR). */
export function readDueWordsLimitFromStorage(): number {
    if (globalThis.window === undefined) return DEFAULT_DUE_WORDS_LIMIT;
    return parseDueWordsLimit(
        getLocalStorageItem(DUE_WORDS_LIMIT_STORAGE_KEY),
        DEFAULT_DUE_WORDS_LIMIT,
    );
}
