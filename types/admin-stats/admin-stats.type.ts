/**
 * Platform stats for the admin dashboard and reports. Copied from
 * learning-service `src/admin-learning/dto/admin-learning.dto.ts` and
 * curriculum-service `src/admin-path/admin-learners.service.ts`.
 */

export interface DateRange {
    /** Inclusive, `YYYY-MM-DD`. */
    from: string;
    /** Inclusive, `YYYY-MM-DD`. */
    to: string;
}

export interface DailyActivity {
    date: string;
    activeLearners: number;
    reviews: number;
    correctReviews: number;
    newWords: number;
}

export interface RetentionCohort {
    /** Monday of the cohort's first week. */
    cohort: string;
    size: number;
    /** Share of the cohort active in week 0, 1, 2… (week 0 is always 1). */
    weeks: number[];
}

export interface LearningStats extends DateRange {
    activeToday: number;
    weeklyActive: number;
    monthlyActive: number;
    activeInRange: number;
    totals: { reviews: number; correctReviews: number; newWords: number };
    daily: DailyActivity[];
    streaks: { label: string; learners: number }[];
    levels: { level: number; learners: number }[];
    retention: RetentionCohort[];
    cards: { source: string; cards: number; due: number }[];
}

export interface PathStats extends DateRange {
    release: { id: string; version: number } | null;
    enrollments: { total: number; newInRange: number; perDay: { date: string; count: number }[] };
    completionsPerDay: { date: string; count: number }[];
    stages: { stageId: string; cefr: string; title: string; learners: number }[];
    funnel: { lessonId: string; position: number; title: string; unitTitle: string; cefr: string; learners: number }[];
    checkpoints: {
        unitId: string;
        unitTitle: string;
        attempts: number;
        passedAttempts: number;
        learners: number;
        passedLearners: number;
    }[];
    placement: { results: number; learners: number; byStage: { stageId: string; cefr: string; learners: number }[] };
}

export interface HardPathItem {
    itemId: string;
    learners: number;
    reviews: number;
    /** 0–1. */
    accuracy: number;
    lapses: number;
}

export interface PathItemLookup {
    id: string;
    slug: string;
    type: string;
    text: string;
    meaningVi: string;
    status: string;
    unitTitle: string | null;
}

/** A hard item with its text, when the lookup found it. */
export type HardPathItemView = HardPathItem & { item: PathItemLookup | null };
