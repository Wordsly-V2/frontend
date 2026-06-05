import type { IDailyHabit } from "@/types/daily-habit/daily-habit.type";
import type { AnswerQuality } from "@/types/word-progress/word-progress.type";

export interface WordResult {
    wordId: string;
    quality: AnswerQuality;
}

export interface SessionCompletePayload {
    score: number;
    wordResults: WordResult[];
    habitState: IDailyHabit;
}

export type PracticePhase = "overview" | "practice";

export type WordLearningStep = "intro" | "exercise";
