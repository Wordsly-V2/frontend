import { AnswerQuality } from "@/types/word-progress/word-progress.type";

export type FlashcardRating = "easy" | "good" | "hard" | "forgot";

const FAST_CORRECT_SECONDS = 8;
const SLOW_CORRECT_SECONDS = 20;

/** Map flashcard self-rating to answer quality (0–5, mapped to FSRS server-side). */
export function flashcardRatingToQuality(rating: FlashcardRating): AnswerQuality {
    switch (rating) {
        case "easy":
            return AnswerQuality.PERFECT;
        case "good":
            return AnswerQuality.CORRECT_WITH_HESITATION;
        case "hard":
            return AnswerQuality.CORRECT_WITH_DIFFICULTY;
        case "forgot":
            return AnswerQuality.COMPLETE_BLACKOUT;
    }
}

/**
 * How long an answer may take before it stops counting as fluent recall.
 * Exercises that are slow by construction (assembling a whole sentence) pass
 * their own, or every correct answer would be scored as a struggle.
 */
export interface AnswerTimeThresholds {
    fastSeconds?: number;
    slowSeconds?: number;
}

/** Quality from correctness, hints used, and optional response time. */
export function calculateAnswerQuality(
    isCorrect: boolean,
    hintsUsed = 0,
    timeSpentSeconds?: number,
    nearMiss = false,
    thresholds?: AnswerTimeThresholds,
): AnswerQuality {
    if (!isCorrect) {
        return AnswerQuality.INCORRECT;
    }

    let quality: AnswerQuality;
    if (hintsUsed === 0) {
        quality = AnswerQuality.PERFECT;
    } else if (hintsUsed === 1) {
        quality = AnswerQuality.CORRECT_WITH_HESITATION;
    } else {
        quality = AnswerQuality.CORRECT_WITH_DIFFICULTY;
    }

    // A typo-tolerant "near" answer counts as correct, but never as a flawless
    // recall — cap it so FSRS still schedules the word for reinforcement.
    if (nearMiss && quality > AnswerQuality.CORRECT_WITH_DIFFICULTY) {
        quality = AnswerQuality.CORRECT_WITH_DIFFICULTY;
    }

    const fastSeconds = thresholds?.fastSeconds ?? FAST_CORRECT_SECONDS;
    const slowSeconds = thresholds?.slowSeconds ?? SLOW_CORRECT_SECONDS;

    if (timeSpentSeconds != null && timeSpentSeconds > 0) {
        if (timeSpentSeconds > slowSeconds && quality > AnswerQuality.CORRECT_WITH_DIFFICULTY) {
            quality = AnswerQuality.CORRECT_WITH_DIFFICULTY;
        } else if (
            timeSpentSeconds > fastSeconds &&
            quality === AnswerQuality.PERFECT
        ) {
            quality = AnswerQuality.CORRECT_WITH_HESITATION;
        }
    }

    return quality;
}

/**
 * Recognition exercises (word bank, cloze pick — anything answered by choosing
 * from options shown on screen) top out here. Picking the right option proves
 * the word was recognised, not that it could be produced, and FSRS "Easy"
 * stretches the next interval far enough that a word only ever recognised
 * would drift out of reach. Easy is reserved for fast, hint-free free recall.
 */
export const MAX_RECOGNITION_QUALITY = AnswerQuality.CORRECT_WITH_HESITATION;

/**
 * Quality for a recognition exercise: graded like free recall, then capped at
 * {@link MAX_RECOGNITION_QUALITY} (FSRS Good).
 */
export function calculateRecognitionAnswerQuality(
    isCorrect: boolean,
    hintsUsed = 0,
    timeSpentSeconds?: number,
): AnswerQuality {
    const quality = calculateAnswerQuality(isCorrect, hintsUsed, timeSpentSeconds);
    return Math.min(quality, MAX_RECOGNITION_QUALITY) as AnswerQuality;
}

/**
 * The single "was this answer correct?" threshold, and it must match the
 * backend: learning-service maps quality < 3 to FSRS Again and counts >= 3 as
 * correct for accuracy and XP. Any client-side line drawn elsewhere (the old
 * `<= 1` weak check let a 2 count as correct here while the server failed it)
 * makes the session score disagree with the report.
 */
export function isCorrectAnswer(quality: AnswerQuality): boolean {
    return quality >= AnswerQuality.CORRECT_WITH_DIFFICULTY;
}

/** A failed answer (FSRS Again): re-queued in the session, breaks the streak. */
export function isWeakAnswer(quality: AnswerQuality): boolean {
    return !isCorrectAnswer(quality);
}
