import { getLocalStorageItem } from "@/lib/local-storage";
import type { IDailyPacing } from "@/types/word-progress/word-progress.type";

/**
 * Size of a whole practice session — due words plus any new words that fit after
 * them. Shared by Learn (course page + quick actions), persisted in
 * localStorage by the course page and read everywhere else.
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

/**
 * Ceiling on how many NEW words a session may contain.
 *
 * It is a share of the session, not an addition to it: a session holds at most
 * `DUE_WORDS_LIMIT` words in total, and this says how many of them may be words
 * the learner has never seen. Set the session to 20 and this to 5 and a day with
 * 20 reviews waiting gives 20 reviews and no new words; a day with 8 reviews
 * gives 8 reviews and 5 new ones. The two map to `limit` and `newLimit` on the
 * due-word-ids endpoint.
 */
export const NEW_WORDS_LIMIT_OPTIONS = [5, 10, 15, 20] as const;

export const NEW_WORDS_LIMIT_STORAGE_KEY = "wordsly-learn-new-words-limit";

export const DEFAULT_NEW_WORDS_LIMIT = 5;

export function parseNewWordsLimit(raw: string | null, initial: number): number {
    if (raw === null) return initial;
    const parsed = Number(raw);
    return NEW_WORDS_LIMIT_OPTIONS.includes(parsed as (typeof NEW_WORDS_LIMIT_OPTIONS)[number])
        ? parsed
        : initial;
}

/** Read persisted new-words limit synchronously on the client (safe for SSR). */
export function readNewWordsLimitFromStorage(): number {
    if (globalThis.window === undefined) return DEFAULT_NEW_WORDS_LIMIT;
    return parseNewWordsLimit(
        getLocalStorageItem(NEW_WORDS_LIMIT_STORAGE_KEY),
        DEFAULT_NEW_WORDS_LIMIT,
    );
}

/**
 * "8 of 15" when the session holds less than everything waiting, plain "8"
 * otherwise.
 *
 * A button that says 15 and then starts a session of 8 reads as a bug, and for a
 * long time it was reported as one. The gap is real and deliberate — session
 * size and daily pacing both cap it — so the honest fix is to name both numbers
 * rather than hide either.
 */
export function formatSessionCount(count: number, total: number): string {
    return total > count ? `${count} of ${total}` : `${count}`;
}

export function getReviewDueButtonLabel(
    isLoading: boolean,
    dueCount: number,
    emptyLabel = "No due words",
    dueTotal: number = dueCount,
): string {
    if (isLoading) return "Loading…";
    if (dueCount > 0)
        return `Review due (${formatSessionCount(dueCount, dueTotal)})`;
    return emptyLabel;
}

export function getLearnNewButtonLabel(
    isLoading: boolean,
    newCount: number,
    newTotal: number = newCount,
): string {
    if (isLoading) return "Loading…";
    if (newCount > 0)
        return `Learn new (${formatSessionCount(newCount, newTotal)})`;
    return "No new words";
}

/** Label for the one dominant practice CTA (dashboard hero, bottom bar). */
export function practiceCtaLabel(
    kind: "review" | "new",
    count: number,
    total: number,
): string {
    const noun = `word${count === 1 ? "" : "s"}`;
    return kind === "review"
        ? `Review ${formatSessionCount(count, total)} due ${noun}`
        : `Learn ${formatSessionCount(count, total)} new ${noun}`;
}

export interface SessionCapInput {
    dueCount: number;
    dueTotal: number;
    newCount: number;
    newTotal: number;
    pacing: IDailyPacing | undefined;
}

/**
 * Why this session is smaller than what is waiting, in one line — or null when
 * it isn't smaller.
 *
 * Two different caps produce the same symptom, and a learner cannot tell them
 * apart from the numbers alone: a session size they chose, and a daily limit
 * they have already spent part of. The daily limit is named first because it is
 * the one that is not obvious and the one that resets tomorrow.
 */
export function describeSessionCap({
    dueCount,
    dueTotal,
    newCount,
    newTotal,
    pacing,
}: SessionCapInput): string | null {
    const dueHeld = Math.max(0, dueTotal - dueCount);
    const newHeld = Math.max(0, newTotal - newCount);
    if (dueHeld === 0 && newHeld === 0) return null;

    if (pacing && dueHeld > 0 && pacing.reviewsRemainingToday <= dueCount) {
        return pacing.reviewsRemainingToday === 0
            ? `Today's review limit of ${pacing.dailyReviewLimit} is used up — ${dueHeld} due ${dueHeld === 1 ? "word waits" : "words wait"} for tomorrow.`
            : `Today's review limit leaves room for ${pacing.reviewsRemainingToday} more — ${dueHeld} due ${dueHeld === 1 ? "word waits" : "words wait"} for tomorrow.`;
    }

    if (pacing && newHeld > 0 && dueHeld === 0 &&
        pacing.newWordsRemainingToday <= newCount) {
        return `Today's new-word limit of ${pacing.dailyNewWordLimit} is reached — new words resume tomorrow.`;
    }

    const held = dueHeld + newHeld;
    return `${held} more ${held === 1 ? "word is" : "words are"} waiting — raise words per session to take them all in one go.`;
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

/**
 * Daily-pacing banner copy. Returns null while there's still headroom today —
 * a banner only appears once the learner hits a daily limit.
 */
export function getPacingBannerCopy(
    pacing: IDailyPacing | undefined,
): { title: string; subtitle: string } | null {
    if (!pacing) return null;
    const { newWordsRemainingToday, reviewsRemainingToday } = pacing;

    if (newWordsRemainingToday === 0 && reviewsRemainingToday === 0) {
        return {
            title: "Daily limit reached — come back tomorrow",
            subtitle: "You've hit today's new-word and review limits. Rest counts too — spaced repetition works best over days.",
        };
    }

    if (newWordsRemainingToday === 0) {
        return {
            title: "You've reached today's new-word limit — reviews only",
            subtitle: `${reviewsRemainingToday} review${reviewsRemainingToday === 1 ? "" : "s"} left today. Keep the words you know fresh.`,
        };
    }

    return null;
}
