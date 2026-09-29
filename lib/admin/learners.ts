import type {
    CardSource,
    LearnerCardCounts,
    LearnerSummary,
    LearningResetScope,
} from "@/types/admin-learners/admin-learners.type";

/** A reset choice on the Learning tab: a scope, and for cards maybe one source. */
export interface LearningResetChoice {
    scope: LearningResetScope;
    source?: CardSource;
}

export const LEARNING_RESET_CHOICES = [
    { id: "cards", label: "All cards", choice: { scope: "cards" } },
    { id: "cards-vocab", label: "Course cards", choice: { scope: "cards", source: "vocab" } },
    { id: "cards-path", label: "Path cards", choice: { scope: "cards", source: "path" } },
    { id: "streak", label: "Streak", choice: { scope: "streak" } },
    { id: "xp", label: "XP and level", choice: { scope: "xp" } },
    { id: "all", label: "Everything", choice: { scope: "all" } },
] as const satisfies readonly { id: string; label: string; choice: LearningResetChoice }[];

export type LearningResetChoiceId = (typeof LEARNING_RESET_CHOICES)[number]["id"];

export interface ResetDescription {
    /** Short name for the confirm button and the toast. */
    name: string;
    removes: string[];
    keeps: string[];
}

const CARDS: Record<CardSource | "both", string> = {
    both: "Every review card (words from their courses and Wordsly Path items) and its schedule",
    vocab: "Review cards for words in their own courses, and their schedule",
    path: "Review cards for Wordsly Path items, and their schedule",
};
const STREAK = "Their streak, best streak, practice days and streak freezes";
const XP = "Their XP, level, achievements and daily XP grants";
const HISTORY = "Their report history (answers and words practised per day)";
const NEVER = "Their settings, saved words and notifications";

/**
 * What a learning reset removes and what it leaves, in the words the confirm
 * dialog shows. Mirrors learning-service `AdminLearningService.reset`.
 */
export function describeLearningReset({ scope, source }: LearningResetChoice): ResetDescription {
    switch (scope) {
        case "cards":
            return {
                name: source === "vocab" ? "course cards" : source === "path" ? "Path cards" : "all cards",
                removes: [CARDS[source ?? "both"]],
                keeps: [
                    ...(source === "vocab" ? [CARDS.path] : source === "path" ? [CARDS.vocab] : []),
                    "Their courses and words, and Wordsly Path progress",
                    `${STREAK}, XP and level`,
                    HISTORY,
                    NEVER,
                ],
            };
        case "streak":
            return {
                name: "streak",
                removes: [STREAK],
                keeps: ["Their daily goal", "Review cards, XP and level", HISTORY, NEVER],
            };
        case "xp":
            return {
                name: "XP and level",
                removes: [XP],
                keeps: ["Review cards and streak", HISTORY, NEVER],
            };
        case "all":
            return {
                name: "all learning data",
                removes: [CARDS.both, STREAK, XP, HISTORY],
                keeps: ["Their daily goal", "Their courses and words, and Wordsly Path progress", NEVER],
            };
    }
}

export function describePathReset(withCards: boolean): ResetDescription {
    return {
        name: withCards ? "Path progress and cards" : "Path progress",
        removes: [
            "Their enrollment and start unit (they choose again, or retake the placement test)",
            "Completed lessons, unit test attempts and placement results",
            ...(withCards ? [CARDS.path] : []),
        ],
        keeps: [
            ...(withCards ? [] : [`${CARDS.path} (they stay in their reviews)`]),
            "Their courses and their cards",
            "Streak, XP and level",
            NEVER,
        ],
    };
}

/** Rows a reset touched, summed over the tables it reports. */
export function affectedTotal(affected: Record<string, number>): number {
    return Object.values(affected).reduce((sum, n) => sum + n, 0);
}

export const CARD_SOURCE_LABELS: Record<string, string> = {
    VOCAB: "Own courses",
    PATH: "Wordsly Path",
};

/** Card counts per source plus a total row, own courses first. */
export function cardRows(cards: LearnerCardCounts[]): { label: string; counts: Omit<LearnerCardCounts, "source"> }[] {
    const order = (source: string) => (source === "VOCAB" ? 0 : source === "PATH" ? 1 : 2);
    const rows = [...cards]
        .sort((a, b) => order(a.source) - order(b.source))
        .map(({ source, ...counts }) => ({ label: CARD_SOURCE_LABELS[source] ?? source, counts }));
    if (rows.length < 2) return rows;
    const total = cards.reduce(
        (sum, c) => ({
            cards: sum.cards + c.cards,
            due: sum.due + c.due,
            leeches: sum.leeches + c.leeches,
            suspended: sum.suspended + c.suspended,
        }),
        { cards: 0, due: 0, leeches: 0, suspended: 0 },
    );
    return [...rows, { label: "Total", counts: total }];
}

/** "26 Sep 2026" for a `YYYY-MM-DD` calendar day, with no time-zone shift. */
export function formatDay(day: string): string {
    const [y, m, d] = day.split("-").map(Number);
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
        new Date(Date.UTC(y, m - 1, d)),
    );
}

/** "Today", "Yesterday", "5 days ago" for a `YYYY-MM-DD` day against `today` (same format). */
export function daysAgo(day: string | null, today: string): string {
    if (!day) return "Never";
    const diff = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)) / 86_400_000);
    if (diff <= 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 30) return `${diff} days ago`;
    return formatDay(day);
}

export function summariesById(summaries: LearnerSummary[] | undefined): Map<string, LearnerSummary> {
    return new Map((summaries ?? []).map((s) => [s.userLoginId, s]));
}
