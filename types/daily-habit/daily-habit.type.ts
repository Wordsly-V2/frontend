export interface IDailyHabitDay {
    date: string;
    words: number;
    goalMet: boolean;
    /** No practice, but a banked freeze covered the day and the streak survived. */
    frozen?: boolean;
}

/** An achievement newly unlocked by a practice session (record-practice response). */
export interface IUnlockedAchievement {
    key: string;
    label: string;
    category: string;
    xpAwarded: number;
    unlockedAt: string;
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
    /** Days with any practice, all time. */
    totalPracticeDays: number;
    /** Days the daily goal was completed, all time. */
    totalGoalDays: number;
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
    /**
     * Consecutive goal-met days still owed for the next freeze, or null while
     * the bank is full. Derived server-side from the day ledger — the client
     * cannot know where in the earn cadence the learner sits.
     */
    goalDaysUntilNextFreeze: number | null;
    /** Achievements newly unlocked by the session that produced this snapshot. */
    unlockedAchievements?: IUnlockedAchievement[];
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

/**
 * Several days of practice in one request, for a client flushing sessions it
 * collected offline. Sending them separately would apply them out of order and
 * mis-count the streak.
 */
export interface IBatchRecordDailyPracticeDto {
    days: { clientDate: string; wordCount: number }[];
    /** The client's today — anchors "words today" and streak decay. */
    clientDate: string;
    /** Idempotency key; a replay returns the original result. */
    clientRequestId?: string;
}

export interface IUpdateDailyGoalDto {
    dailyGoal: number;
}

export const DAILY_GOAL_OPTIONS = [5, 10, 15, 20, 30] as const;

/** Freeze economy — mirrors the learning-service constants. */
export const FREEZE_FIRST_EARN_GOAL_DAYS = 3;
export const FREEZE_REPEAT_EARN_GOAL_DAYS = 2;
export const MAX_STREAK_FREEZES = 2;
