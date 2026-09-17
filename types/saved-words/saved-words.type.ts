/**
 * A word the learner flagged as hard on purpose.
 *
 * Distinct from `ILeechWord`, which the scheduler flags on its own after enough
 * lapses. A word can be both — the "Difficult words" screen shows one list and
 * badges each row with why it is there.
 */
export interface ISavedWord {
    wordId: string;
    /** The learner's own note on why it is hard. */
    note?: string;
    savedAt: string;
    /** Null when the word has never been practised. */
    nextReviewAt: string | null;
    successRate: number;
    totalReviews: number;
    /** Whether the scheduler ALSO flags it as a leech. */
    isLeech: boolean;
    /**
     * True once it is a settled Review-state card on a run of correct answers.
     * Saved words are never removed automatically; this only lets the UI offer
     * it, because the shelf is the learner's to clear.
     */
    isSettled: boolean;
}

export interface ISavedWordsResponse {
    savedWords: ISavedWord[];
}

/** Scope for the saved-words listing; all fields omitted means "everything". */
export interface SavedWordsScope {
    courseId?: string;
    lessonId?: string;
    wordIds?: string[];
}

export interface ISaveWordDto {
    wordId: string;
    note?: string;
}
