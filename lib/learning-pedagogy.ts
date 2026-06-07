import { getClozePrompt } from "@/lib/practice-utils";
import type { WordLearningStage } from "@/lib/word-progress-stage";
import type { IWord } from "@/types/courses/courses.type";

export type PedagogyPracticeMode =
    | "typing"
    | "listening"
    | "multiple-choice"
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

export const PRODUCTION_MODES = ["typing", "listening"] as const;
export const RECOGNITION_MODES = ["multiple-choice", "cloze"] as const;

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
    if (mode === "cloze" && !clozeAvailable) return false;
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

export interface AssignMixedModeInput {
    word: IWord;
    stage: WordLearningStage;
    allowed: Set<string>;
    isLeech: boolean;
    preferProduction: boolean;
    retryPass: boolean;
    previousMode?: PedagogyPracticeMode;
    /** 0-based occurrence of this word in the current session queue. */
    newWordRound?: number;
    /** Queue index — rotates modes within each production/recognition pool. */
    modeSlotIndex?: number;
}

/**
 * Assign a practice mode using retrieval-practice research:
 * - New words: recognition then production across session rounds
 * - Learning/due/review: alternate production ↔ recognition (bidirectional recall)
 * - Leeches: flashcard self-rating with context (depth of processing)
 * - Retry: opposite direction from the main pass (interleaving)
 */
export function assignMixedPracticeMode(input: AssignMixedModeInput): {
    mode: PedagogyPracticeMode;
    nextPreferProduction: boolean;
} {
    const {
        word,
        stage,
        allowed,
        isLeech,
        preferProduction,
        retryPass,
        previousMode,
        newWordRound,
        modeSlotIndex = 0,
    } = input;

    const clozeAvailable = getClozePrompt(word) != null;
    const listeningAvailable = Boolean(word.audioUrl);
    const pick = (pool: readonly string[]) =>
        pickPracticeMode(
            pool,
            allowed,
            clozeAvailable,
            listeningAvailable,
            modeSlotIndex,
        );

    if (isLeech) {
        return { mode: "flashcard", nextPreferProduction: preferProduction };
    }

    if (retryPass && previousMode) {
        return {
            mode: alternatePracticeMode(
                previousMode,
                allowed,
                clozeAvailable,
                listeningAvailable,
            ),
            nextPreferProduction: preferProduction,
        };
    }

    if (stage === "new" && newWordRound !== undefined) {
        let roundPool: readonly string[];
        if (newWordRound === 0) {
            roundPool = RECOGNITION_MODES;
        } else if (newWordRound === 1) {
            roundPool = PRODUCTION_MODES;
        } else if (listeningAvailable) {
            roundPool = ["listening", "typing"];
        } else {
            roundPool = PRODUCTION_MODES;
        }
        const mode = pick(roundPool);
        if (mode) return { mode, nextPreferProduction: preferProduction };
    }

    if (stage === "new") {
        const mode = pick(RECOGNITION_MODES) ?? pick(PRODUCTION_MODES);
        if (mode) return { mode, nextPreferProduction: preferProduction };
    } else {
        const pool = preferProduction ? PRODUCTION_MODES : RECOGNITION_MODES;
        const mode =
            pick(pool) ??
            pick([...PRODUCTION_MODES, ...RECOGNITION_MODES]);
        if (mode) {
            return { mode, nextPreferProduction: !preferProduction };
        }
    }

    const fallback =
        pick([...RECOGNITION_MODES, ...PRODUCTION_MODES]) ?? "typing";

    return { mode: fallback, nextPreferProduction: preferProduction };
}
