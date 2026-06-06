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

/** Pick the first usable mode from a pool within stage constraints. */
export function pickPracticeMode(
    pool: readonly string[],
    allowed: Set<string>,
    clozeAvailable: boolean,
    listeningAvailable: boolean,
): PedagogyPracticeMode | null {
    for (const mode of pool) {
        if (!allowed.has(mode)) continue;
        if (!modeAvailable(mode, clozeAvailable, listeningAvailable)) continue;
        return mode as PedagogyPracticeMode;
    }
    return null;
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
        pickPracticeMode(pool, allowed, clozeAvailable, listeningAvailable) ??
        pickPracticeMode(
            [...PRODUCTION_MODES, ...RECOGNITION_MODES],
            allowed,
            clozeAvailable,
            listeningAvailable,
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
}

/**
 * Assign a practice mode using retrieval-practice research:
 * - New/learning: recognition before production (comprehensible input → recall)
 * - Review/due: alternate production ↔ recognition (bidirectional recall)
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
    } = input;

    const clozeAvailable = getClozePrompt(word) != null;
    const listeningAvailable = Boolean(word.audioUrl);

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
        const mode = pickPracticeMode(roundPool, allowed, clozeAvailable, listeningAvailable);
        if (mode) return { mode, nextPreferProduction: preferProduction };
    }

    if (stage === "new" || stage === "learning") {
        const mode =
            pickPracticeMode(RECOGNITION_MODES, allowed, clozeAvailable, listeningAvailable) ??
            pickPracticeMode(PRODUCTION_MODES, allowed, clozeAvailable, listeningAvailable);
        if (mode) return { mode, nextPreferProduction: preferProduction };
    } else {
        const pool = preferProduction ? PRODUCTION_MODES : RECOGNITION_MODES;
        const mode =
            pickPracticeMode(pool, allowed, clozeAvailable, listeningAvailable) ??
            pickPracticeMode(
                [...PRODUCTION_MODES, ...RECOGNITION_MODES],
                allowed,
                clozeAvailable,
                listeningAvailable,
            );
        if (mode) {
            return { mode, nextPreferProduction: !preferProduction };
        }
    }

    const fallback =
        pickPracticeMode(
            [...RECOGNITION_MODES, ...PRODUCTION_MODES],
            allowed,
            clozeAvailable,
            listeningAvailable,
        ) ?? "typing";

    return { mode: fallback, nextPreferProduction: preferProduction };
}
