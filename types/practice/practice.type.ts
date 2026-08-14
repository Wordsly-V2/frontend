import type { IDailyHabit } from "@/types/daily-habit/daily-habit.type";
import type { AnswerQuality } from "@/types/word-progress/word-progress.type";

export interface WordResult {
    wordId: string;
    quality: AnswerQuality;
    /**
     * ISO instant this grade was given.
     *
     * Stamped when the answer happens, not when the session is saved: a session
     * can run for twenty minutes, and an offline one may not sync for days, so
     * collapsing everything onto the save time would hand the scheduler the
     * wrong intervals. Because results merge worst-attempt-wins, this is the
     * instant of the *recorded* grade, not of the word's last appearance.
     */
    reviewedAt?: string;
}

export interface SessionCompletePayload {
    score: number;
    wordResults: WordResult[];
    habitState: IDailyHabit;
}

export type PracticePhase = "overview" | "practice";

export type WordLearningStep = "intro" | "exercise";
