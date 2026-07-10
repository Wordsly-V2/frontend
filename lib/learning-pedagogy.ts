import { getClozePrompt } from "@/lib/practice-utils";
import type { WordLearningStage } from "@/lib/word-progress-stage";
import type { IWord } from "@/types/courses/courses.type";

export type PedagogyPracticeMode =
    | "listening"
    | "context"
    | "word-bank"
    | "cloze"
    | "flashcard";

/**
 * Evidence-based vocabulary learning constants for Wordsly.
 *
 * Grounded in: Dunlosky et al. (2013) — practice testing, distributed practice,
 * interleaving; Nakata — retrieval practice + spacing; Bjork — desirable
 * difficulties; Laufer & Hulstijn — involvement load; Krashen — comprehensible
 * input (i+1); Nation/Schmitt — ~5–10 new items per day.
 */
export const PEDAGOGY = {
    dailyNewWordGoal: 10,
    leechMinReviews: 3,
    leechSuccessRateMax: 50,
    /** Minutes before second learning step (Anki-style intraday graduation). */
    firstLearningStepMinutes: 10,
    /**
     * How many exercises each new word gets in one session (interleaved).
     * Round 1 recognition → round 2+ production (Nakata: multiple retrieval rounds).
     */
    newWordSessionRepetitions: 3,
} as const;

export type PracticeDirection = "production" | "recognition";

export const PRODUCTION_MODES = ["listening", "context"] as const;
export const RECOGNITION_MODES = ["word-bank", "cloze"] as const;

export function modeDirection(mode: string): PracticeDirection | null {
    if ((PRODUCTION_MODES as readonly string[]).includes(mode)) return "production";
    if ((RECOGNITION_MODES as readonly string[]).includes(mode)) return "recognition";
    return null;
}

function modeAvailable(
    mode: string,
    clozeAvailable: boolean,
    listeningAvailable: boolean,
): boolean {
    // Both cloze and context need an example sentence containing the word.
    if ((mode === "cloze" || mode === "context") && !clozeAvailable) return false;
    if (mode === "listening" && !listeningAvailable) return false;
    return true;
}

/** Pick a usable mode from a pool, cycling by slot for variety in mixed sessions. */
export function pickPracticeMode(
    pool: readonly string[],
    allowed: Set<string>,
    clozeAvailable: boolean,
    listeningAvailable: boolean,
    slotIndex = 0,
): PedagogyPracticeMode | null {
    const available = pool.filter(
        (mode) =>
            allowed.has(mode) &&
            modeAvailable(mode, clozeAvailable, listeningAvailable),
    );
    if (available.length === 0) return null;
    return available[slotIndex % available.length] as PedagogyPracticeMode;
}

/** Swap production ↔ recognition for retry interleaving (Nakata 2019). */
export function alternatePracticeMode(
    mode: PedagogyPracticeMode,
    allowed: Set<string>,
    clozeAvailable: boolean,
    listeningAvailable: boolean,
): PedagogyPracticeMode {
    const direction = modeDirection(mode);
    let pool: readonly string[];
    if (direction === "production") {
        pool = RECOGNITION_MODES;
    } else if (direction === "recognition") {
        pool = PRODUCTION_MODES;
    } else {
        pool = [...PRODUCTION_MODES, ...RECOGNITION_MODES];
    }

    return (
        pickPracticeMode(pool, allowed, clozeAvailable, listeningAvailable, 0) ??
        pickPracticeMode(
            [...PRODUCTION_MODES, ...RECOGNITION_MODES],
            allowed,
            clozeAvailable,
            listeningAvailable,
            0,
        ) ??
        mode
    );
}

export type PracticeModePool = "production" | "recognition";

export interface AssignMixedModeInput {
    word: IWord;
    stage: WordLearningStage;
    allowed: Set<string>;
    isLeech: boolean;
    preferProduction: boolean;
    /** 0-based occurrence of this word in the current session queue. */
    newWordRound?: number;
    /** Separate counters so prod/rec alternation still rotates listening ↔ context, quiz ↔ cloze. */
    productionSlotIndex?: number;
    recognitionSlotIndex?: number;
}

/**
 * Assign a practice mode using retrieval-practice research:
 * - New words: recognition then production across session rounds
 * - Learning/due/review: alternate production ↔ recognition (bidirectional recall)
 * - Leeches: flashcard self-rating with context (depth of processing)
 */
export function assignMixedPracticeMode(input: AssignMixedModeInput): {
    mode: PedagogyPracticeMode;
    nextPreferProduction: boolean;
    poolUsed?: PracticeModePool;
} {
    const {
        word,
        stage,
        allowed,
        isLeech,
        preferProduction,
        newWordRound,
        productionSlotIndex = 0,
        recognitionSlotIndex = 0,
    } = input;

    const clozeAvailable = getClozePrompt(word) != null;
    const listeningAvailable = Boolean(word.audioUrl);
    const pick = (pool: readonly string[], poolKind: PracticeModePool) =>
        pickPracticeMode(
            pool,
            allowed,
            clozeAvailable,
            listeningAvailable,
            poolKind === "production" ? productionSlotIndex : recognitionSlotIndex,
        );

    if (isLeech) {
        return { mode: "flashcard", nextPreferProduction: preferProduction };
    }

    if (stage === "new" && newWordRound !== undefined) {
        let roundPool: readonly string[];
        let poolKind: PracticeModePool;
        if (newWordRound === 0) {
            roundPool = RECOGNITION_MODES;
            poolKind = "recognition";
        } else if (newWordRound === 1) {
            roundPool = PRODUCTION_MODES;
            poolKind = "production";
        } else if (listeningAvailable) {
            roundPool = ["listening", "context"];
            poolKind = "production";
        } else {
            roundPool = PRODUCTION_MODES;
            poolKind = "production";
        }
        const mode = pick(roundPool, poolKind);
        if (mode) {
            return { mode, nextPreferProduction: preferProduction, poolUsed: poolKind };
        }
    }

    if (stage === "new") {
        const mode =
            pick(RECOGNITION_MODES, "recognition") ??
            pick(PRODUCTION_MODES, "production");
        if (mode) {
            const poolUsed: PracticeModePool =
                modeDirection(mode) === "production" ? "production" : "recognition";
            return { mode, nextPreferProduction: preferProduction, poolUsed };
        }
    } else {
        const poolKind: PracticeModePool = preferProduction ? "production" : "recognition";
        const pool = preferProduction ? PRODUCTION_MODES : RECOGNITION_MODES;
        const mode =
            pick(pool, poolKind) ??
            pick([...PRODUCTION_MODES, ...RECOGNITION_MODES], poolKind);
        if (mode) {
            const resolvedPool: PracticeModePool =
                modeDirection(mode) === "production" ? "production" : "recognition";
            return {
                mode,
                nextPreferProduction: !preferProduction,
                poolUsed: resolvedPool,
            };
        }
    }

    const fallbackSlot = productionSlotIndex + recognitionSlotIndex;
    const fallback =
        pickPracticeMode(
            [...RECOGNITION_MODES, ...PRODUCTION_MODES],
            allowed,
            clozeAvailable,
            listeningAvailable,
            fallbackSlot,
        ) ?? "word-bank";
    const poolUsed: PracticeModePool =
        modeDirection(fallback) === "production" ? "production" : "recognition";

    return { mode: fallback, nextPreferProduction: preferProduction, poolUsed };
}
