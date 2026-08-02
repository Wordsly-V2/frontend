import { AnswerQuality } from "@/types/word-progress/word-progress.type";

export type FlashcardRating = "easy" | "good" | "hard" | "forgot";

const FAST_CORRECT_SECONDS = 8;
const SLOW_CORRECT_SECONDS = 20;

/** Map flashcard self-rating to SM-2 quality. */
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

export function isWeakAnswer(quality: AnswerQuality): boolean {
    return quality <= AnswerQuality.INCORRECT;
}
