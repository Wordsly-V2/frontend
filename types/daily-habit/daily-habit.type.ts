export interface IDailyHabit {
    date: string;
    wordsToday: number;
    streak: number;
    lastPracticeDate: string | null;
    goal: number;
}

export interface IRecordDailyPracticeDto {
    wordCount: number;
    clientDate: string;
}
