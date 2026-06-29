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
    /** Practiced yesterday but not yet today — one missed day breaks the streak. */
    streakAtRisk: boolean;
    /** Next streak length worth celebrating, or null past the top milestone. */
    nextMilestone: number | null;
    /** Banked streak freezes that auto-protect the streak on a missed day. */
    streakFreezes: number;
    /** A banked freeze is currently bridging one or more missed days. */
    streakShielded: boolean;
    message: string;
}

/** Streak lengths worth celebrating / working toward (mirrors the backend). */
export const STREAK_MILESTONES = [7, 14, 30, 60, 100, 180, 365] as const;

export function nextStreakMilestone(streak: number): number | null {
    for (const milestone of STREAK_MILESTONES) {
        if (streak < milestone) return milestone;
    }
    return null;
}

export interface IRecordDailyPracticeDto {
    wordCount: number;
    clientDate: string;
}

export interface IUpdateDailyGoalDto {
    dailyGoal: number;
}

export const DAILY_GOAL_OPTIONS = [5, 10, 15, 20, 30] as const;

/** Freeze economy — mirrors the learning-service constants. */
export const FREEZE_EARN_GOAL_STREAKS = [3, 5] as const;
export const MAX_STREAK_FREEZES = 2;

/**
 * Goal-met days remaining until the next freeze is earned, or null when the
 * balance is already full or all freeze thresholds have been passed.
 */
export function goalDaysUntilNextFreeze(
    goalStreak: number,
    freezes: number,
): number | null {
    if (freezes >= MAX_STREAK_FREEZES) return null;
    const next = FREEZE_EARN_GOAL_STREAKS.find(
        (threshold) => threshold > goalStreak,
    );
    return next === undefined ? null : next - goalStreak;
}
