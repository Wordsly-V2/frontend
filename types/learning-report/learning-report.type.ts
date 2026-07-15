export type ReportPeriod = "week" | "month" | "year";
export type ReportGranularity = "day" | "month";

export interface IReportRange {
    start: string;
    end: string;
}

export interface IReportBucket {
    /** 'YYYY-MM-DD' (daily) or 'YYYY-MM' (monthly). */
    key: string;
    start: string;
    wordsPracticed: number;
    reviews: number;
    correctReviews: number;
    /** Correct-answer percentage, or null when no reviews that bucket. */
    accuracy: number | null;
    daysActive: number;
    goalMetDays: number;
    newWords: number;
}

export interface IReportSummary {
    wordsLearned: number;
    totalReviews: number;
    avgAccuracy: number;
    activeDays: number;
    goalMetDays: number;
    newWords: number;
}

export interface IReportMastery {
    learningWords: number;
    reviewWords: number;
    masteredWords: number;
    totalStarted: number;
}

export interface IReportStreaks {
    current: number;
    longest: number;
    goalStreak: number;
    longestGoalStreak: number;
}

export interface IReportLevel {
    level: number;
    rank: string;
    totalXp: number;
    currentLevelXp: number;
    xpForThisLevel: number;
    xpToNextLevel: number;
    progress: number;
}

export type AchievementCategory = "streak" | "words" | "days";

export interface IReportAchievement {
    key: string;
    label: string;
    category: AchievementCategory;
    achieved: boolean;
    value: number;
    target: number;
}

export interface ILearningReport {
    period: ReportPeriod;
    granularity: ReportGranularity;
    range: IReportRange;
    buckets: IReportBucket[];
    summary: IReportSummary;
    mastery: IReportMastery;
    streaks: IReportStreaks;
    level: IReportLevel;
    achievements: IReportAchievement[];
}

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
    week: "Week",
    month: "Month",
    year: "Year",
};

/** Selectable forecast windows. */
export type ForecastDays = 7 | 30;

export interface IForecastBucket {
    /** 'YYYY-MM-DD'. */
    date: string;
    count: number;
}

/** Response for GET /learning-report/forecast. */
export interface IReviewForecast {
    days: number;
    start: string;
    /** Reviews already overdue (not counted in the per-day buckets). */
    overdue: number;
    /** Total reviews across the window (incl. overdue). */
    total: number;
    buckets: IForecastBucket[];
}

export interface IActivityDay {
    /** 'YYYY-MM-DD'. */
    date: string;
    wordsPracticed: number;
    goalMet: boolean;
}

/** Response for GET /learning-report/activity-calendar. */
export interface IActivityCalendar {
    start: string;
    end: string;
    days: IActivityDay[];
}
