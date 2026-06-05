export interface IDailyHabitDay {
    date: string;
    words: number;
    goalMet: boolean;
}

export interface IDailyHabit {
    date: string;
    wordsToday: number;
    streak: number;
    longestStreak: number;
    goalStreak: number;
    longestGoalStreak: number;
    lastPracticeDate: string | null;
    goal: number;
    goalMetToday: boolean;
    totalWordsPracticed: number;
    totalPracticeDays: number;
    wordsThisWeek: number;
    daysActiveThisWeek: number;
    recentDays: IDailyHabitDay[];
    message: string;
}

export interface IRecordDailyPracticeDto {
    wordCount: number;
    clientDate: string;
}

export interface IUpdateDailyGoalDto {
    dailyGoal: number;
}

export const DAILY_GOAL_OPTIONS = [5, 10, 15, 20, 30] as const;
