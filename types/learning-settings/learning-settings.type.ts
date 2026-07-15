/** Daily-pacing + leech settings owned by learning-service. */
export interface ILearningSettings {
    /** Max brand-new words introduced per local day. */
    dailyNewWordLimit: number;
    /** Max reviews surfaced per local day. */
    dailyReviewLimit: number;
    /** Lapses before a word is flagged a leech. */
    leechThreshold: number;
    /** Auto-suspend a word once it crosses the leech threshold. */
    leechAutoSuspend: boolean;
}

/** Partial update payload for PATCH /learning-settings. */
export type IUpdateLearningSettingsDto = Partial<ILearningSettings>;

/** Selectable daily new-word limits (matches the practice-settings dialog). */
export const DAILY_NEW_WORD_LIMIT_OPTIONS = [5, 10, 15, 20] as const;

/** Selectable daily review limits. */
export const DAILY_REVIEW_LIMIT_OPTIONS = [50, 100, 200, 500] as const;
