import { normalizeAnswer } from "@/lib/practice-utils";
import type { ImportWordRow } from "@/lib/word-import";

/**
 * Where each staged word stands before import, decided in list order:
 * - `skipped`: the learner left it out;
 * - `in-lesson`: the lesson already has this word;
 * - `duplicate`: an earlier row in the list has it;
 * - `needs-meaning`: no meaning yet (the server refuses a word without one);
 * - `over-limit`: ready, but the lesson is full by the time it is reached;
 * - `ready`: it will be imported.
 * `keepDuplicate` lets a repeated word through on purpose.
 */
export type RowStatus = "ready" | "needs-meaning" | "duplicate" | "in-lesson" | "over-limit" | "skipped";

export const ROW_STATUSES: readonly RowStatus[] = [
    "ready",
    "needs-meaning",
    "duplicate",
    "in-lesson",
    "over-limit",
    "skipped",
];

export interface ImportReview {
    status: Record<string, RowStatus>;
    counts: Record<RowStatus, number>;
    /** The rows that will be sent, in list order. */
    importable: ImportWordRow[];
}

/** How two spellings of a word are compared: case, spacing and end punctuation ignored. */
export const wordKey = (word: string) => normalizeAnswer(word);

export function reviewImport(
    rows: readonly ImportWordRow[],
    { existingWords = [], remaining = null }: { existingWords?: readonly string[]; remaining?: number | null } = {},
): ImportReview {
    const inLesson = new Set(existingWords.map(wordKey));
    const seen = new Set<string>();
    const status: Record<string, RowStatus> = {};
    const counts = Object.fromEntries(ROW_STATUSES.map((s) => [s, 0])) as Record<RowStatus, number>;
    const importable: ImportWordRow[] = [];

    for (const row of rows) {
        const key = wordKey(row.word);
        let next: RowStatus;
        if (row.skipped) next = "skipped";
        else if (!row.keepDuplicate && inLesson.has(key)) next = "in-lesson";
        else if (!row.keepDuplicate && seen.has(key)) next = "duplicate";
        else if (!row.meaning.trim() || !key) next = "needs-meaning";
        else if (remaining != null && importable.length >= remaining) next = "over-limit";
        else next = "ready";

        if (!row.skipped && key) seen.add(key);
        if (next === "ready") importable.push(row);
        status[row.id] = next;
        counts[next] += 1;
    }
    return { status, counts, importable };
}

/** Rows whose status can be fixed by the learner, first in a filtered view. */
export const NEEDS_ATTENTION: readonly RowStatus[] = ["needs-meaning", "duplicate", "in-lesson", "over-limit"];

/** The list filter chips: everything, what needs a look, what will go in, and what is left out. */
export const REVIEW_FILTERS = ["all", "attention", "ready", "skipped"] as const;
export type ReviewFilter = (typeof REVIEW_FILTERS)[number];

export function matchesFilter(status: RowStatus, filter: ReviewFilter): boolean {
    switch (filter) {
        case "all":
            return true;
        case "attention":
            return NEEDS_ATTENTION.includes(status);
        case "ready":
            return status === "ready";
        case "skipped":
            return status === "skipped";
    }
}

/** Lookup progress for the bar: rows asked so far out of rows that need asking. */
export function lookupCounts(rows: readonly ImportWordRow[]) {
    let found = 0;
    let notFound = 0;
    let failed = 0;
    for (const row of rows) {
        if (row.lookup === "found") found += 1;
        else if (row.lookup === "not-found") notFound += 1;
        else if (row.lookup === "failed") failed += 1;
    }
    return { found, notFound, failed, done: found + notFound + failed, total: rows.length };
}

/** How many words still fit in a lesson; null when it has no limit. */
export function lessonRoom(lesson: { maxWords?: number | null; words?: readonly unknown[] } | undefined): number | null {
    if (!lesson || lesson.maxWords == null) return null;
    return Math.max(0, lesson.maxWords - (lesson.words?.length ?? 0));
}

/** "1 word", "12 words". */
export function wordCount(n: number): string {
    return `${n.toLocaleString()} ${n === 1 ? "word" : "words"}`;
}
