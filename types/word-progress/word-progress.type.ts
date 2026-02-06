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
