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
    /**
     * ISO instant the user actually answered. Sent so the backend schedules from
     * the moment of the review rather than the moment it reached the server —
     * without it, a session answered offline on Monday and synced on Wednesday
     * gets Wednesday's intervals.
     */
    reviewedAt?: string;
}

export interface IBulkRecordAnswersDto {
    answers: IRecordAnswerDto[];
    /** Client local calendar date (YYYY-MM-DD) for the client's today. */
    clientDate?: string;
    /**
     * Minutes to ADD to a UTC instant to get local wall-clock time
     * (`-getTimezoneOffset()`), so the server can put each answer on the right
     * calendar day when a batch spans more than one.
     */
    tzOffsetMinutes?: number;
    /**
     * Stable id for this flush, generated once and reused on every retry. Makes
     * a resend after a lost response a no-op server-side instead of a second XP
     * award and a second scheduling step.
     */
    clientRequestId?: string;
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
    /**
     * Words that counted toward the daily goal, keyed by local calendar date.
     *
     * A word counts at most once a day however many times it was answered, so
     * this is what the daily-habit call must send. The client used to count the
     * session itself, which meant a second round through the same words — now
     * one tap away, from the difficult-words list — inflated the goal.
     */
    countedWordsByDate?: Record<string, number>;
}

/** Daily pacing snapshot returned alongside due-word-ids. */
export interface IDailyPacing {
    newWordsRemainingToday: number;
    reviewsRemainingToday: number;
    dailyNewWordLimit: number;
    dailyReviewLimit: number;
}

/**
 * One session's worth of words, plus the totals it was drawn from.
 *
 * `wordIds` is the session in order (due first, then new) and is what a practice
 * URL carries. The two halves are named separately because the server knows
 * which is which; the client used to work it out by asking twice and
 * subtracting one list from the other, which mislabelled any due word that moved
 * between the two requests.
 *
 * `dueTotal` / `newTotal` are uncapped counts in scope, so the UI can say
 * "Review 8 of 15 due" instead of showing one number and starting a session of
 * another.
 */
export interface IDueWordIdsResponse {
    wordIds: string[];
    dueWordIds: string[];
    newWordIds: string[];
    dueTotal: number;
    newTotal: number;
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
    /** Size of the whole session — due words plus the new ones that fit after them. */
    limit?: number;
    /**
     * Ceiling on NEW (never-studied) words inside that session. It narrows the
     * room due words leave; it is not an extra allowance on top of `limit`.
     */
    newLimit?: number;
    includeNew?: boolean;
}
