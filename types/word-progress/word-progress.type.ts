import { IWord } from "../courses/courses.type";

/**
 * Quality rating for spaced repetition (SM-2 algorithm)
 */
export enum AnswerQuality {
    COMPLETE_BLACKOUT = 0,      // Complete blackout
    INCORRECT = 1,               // Incorrect response, correct answer remembered
    INCORRECT_BUT_EASY = 2,     // Incorrect response, correct answer seemed easy to recall
    CORRECT_WITH_DIFFICULTY = 3, // Correct response recalled with serious difficulty
    CORRECT_WITH_HESITATION = 4, // Correct response after hesitation
    PERFECT = 5,                 // Perfect response
}

export interface IRecordAnswerDto {
    wordId: string;
    quality: AnswerQuality;
}

export interface IBulkRecordAnswersDto {
    answers: IRecordAnswerDto[];
    /** Client local calendar date (YYYY-MM-DD); powers the accuracy trend in the report. */
    clientDate?: string;
}

export interface IWordProgressResponse {
    id: string;
    wordId: string;
    userLoginId: string;
    easeFactor: number;
    interval: number;
    repetitions: number;
    lastReviewedAt?: Date;
    nextReviewAt: Date;
    totalReviews: number;
    correctReviews: number;
    successRate: number;
    /** FSRS card state (e.g. "New" | "Learning" | "Review" | "Relearning"). */
    state?: string;
    /** Number of times the word lapsed (forgotten after being learned). */
    lapses?: number;
    /** Server-authoritative leech flag; prefer over the client heuristic. */
    isLeech?: boolean;
    /** When the word was auto-suspended as a leech, else null/absent. */
    suspendedAt?: string | Date | null;
}

/** Level snapshot + XP delta returned by the bulk-sync endpoint. */
export interface ILevelEvent {
    level: number;
    rank: string;
    totalXp: number;
    currentLevelXp: number;
    xpForThisLevel: number;
    xpToNextLevel: number;
    progress: number;
    /** XP earned by this batch of answers. */
    xpEarned: number;
    /** True when this batch pushed the learner across a level boundary. */
    leveledUp: boolean;
    previousLevel: number;
}

/** Response shape for POST /word-progress/record-answer/bulk-sync. */
export interface IBulkRecordAnswersResponse {
    results: IWordProgressResponse[];
    levelEvent?: ILevelEvent;
    /** Streak-bonus multiplier applied to XP (1 = no bonus). */
    xpMultiplier: number;
}

/** Daily pacing snapshot returned alongside due-word-ids. */
export interface IDailyPacing {
    newWordsRemainingToday: number;
    reviewsRemainingToday: number;
    dailyNewWordLimit: number;
    dailyReviewLimit: number;
}

/** Response shape for the due-word-ids endpoints (ids + optional pacing). */
export interface IDueWordIdsResponse {
    wordIds: string[];
    pacing?: IDailyPacing;
}

/** A leech (repeatedly-failed) word surfaced for remediation. */
export interface ILeechWord {
    wordId: string;
    lapses: number;
    state: string;
    totalReviews: number;
    correctReviews: number;
    successRate: number;
    suspendedAt: string | null;
    nextReviewAt: string;
}

export interface ILeechesResponse {
    leeches: ILeechWord[];
}

/** Scope for the leeches query. */
export interface LeechScope {
    courseId?: string;
    lessonId?: string;
}

export interface IDueWord extends IWordProgressResponse {
    word: IWord;
    isNew: boolean;
}

export interface IWordProgressStats {
    totalWords: number;
    newWords: number;
    learningWords: number;
    reviewWords: number;
    dueToday: number;
    overallSuccessRate: number;
}

/** Scope for due-words / due-word-ids / progress-stats queries. */
export interface WordProgressScope {
    courseId?: string;
    lessonId?: string;
    limit?: number;
    includeNew?: boolean;
}
