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

export function getReviewDueButtonLabel(
    isLoading: boolean,
    dueCount: number,
    emptyLabel = "No due words",
): string {
    if (isLoading) return "Loading…";
    if (dueCount > 0) return `Review due (${dueCount})`;
    return emptyLabel;
}

export function getLearnNewButtonLabel(isLoading: boolean, newCount: number): string {
    if (isLoading) return "Loading…";
    if (newCount > 0) return `Learn new (${newCount})`;
    return "No new words";
}

/** Words in a practice batch (includeNew) that are not in the due-only set. */
export function deriveNewWordIds(
    dueWordIds: string[] | undefined,
    practiceBatchWordIds: string[] | undefined,
): string[] {
    const dueSet = new Set(dueWordIds ?? []);
    return (practiceBatchWordIds ?? []).filter((id) => !dueSet.has(id));
}

export function getPracticeBannerCopy(
    dueWordCount: number,
    newWordCount: number,
    dueTodayTotal?: number,
    newWordsTotal?: number,
): { title: string; subtitle: string } | null {
    if (dueWordCount === 0 && newWordCount === 0) return null;

    const dueTotal = dueTodayTotal ?? dueWordCount;
    const newTotal = newWordsTotal ?? newWordCount;

    if (dueWordCount > 0 && newWordCount > 0) {
        return {
            title: "Review due words or learn new ones",
            subtitle: `${dueTotal} due for review · ${newTotal.toLocaleString()} new in this course`,
        };
    }

    if (dueWordCount > 0) {
        return {
            title: `${dueTotal} word${dueTotal === 1 ? "" : "s"} due for review`,
            subtitle: "Review now while they are fresh — spaced repetition works best on schedule.",
        };
    }

    return {
        title: `${newTotal.toLocaleString()} new word${newTotal === 1 ? "" : "s"} to learn`,
        subtitle: "Start a fresh batch — introductions and guided practice for words you haven't studied yet.",
    };
}
