/**
 * Shapes of the per-learner admin APIs: learning-service `/admin/learning/users`
 * (`src/admin-learning/dto/admin-learning.dto.ts`) and curriculum-service
 * `/admin/path/users` (`src/admin-path/admin-learners.service.ts`).
 */

/** One row per requested id; zeros when the learner has no data yet. */
export interface LearnerSummary {
    userLoginId: string;
    /** Last day with any practice or answer, on the learner's calendar (`YYYY-MM-DD`). */
    lastActiveDate: string | null;
    streak: number;
    level: number;
    totalXp: number;
    cards: number;
    dueNow: number;
}

/** Most ids one summary request may carry. */
export const MAX_SUMMARY_IDS = 100;

export interface LearnerCardCounts {
    /** `VOCAB` or `PATH`. */
    source: string;
    cards: number;
    due: number;
    leeches: number;
    suspended: number;
}

export interface LearnerOverview {
    userLoginId: string;
    lastActiveDate: string | null;
    habit: {
        streak: number;
        /** A stored streak only counts while the last practice was within 2 days. */
        streakAlive: boolean;
        longestStreak: number;
        dailyGoal: number;
        totalPracticeDays: number;
        lastPracticeDate: string | null;
        streakFreezes: number;
    } | null;
    level: { level: number; totalXp: number };
    cards: LearnerCardCounts[];
    achievements: number;
}

/** What `POST /admin/learning/users/:id/reset` clears. */
export const LEARNING_RESET_SCOPES = ["cards", "streak", "xp", "all"] as const;
export type LearningResetScope = (typeof LEARNING_RESET_SCOPES)[number];

/** Only with the `cards` scope: clear one source's cards and keep the other's. */
export const CARD_SOURCES = ["vocab", "path"] as const;
export type CardSource = (typeof CARD_SOURCES)[number];

export interface LearningResetResult {
    scope: LearningResetScope;
    source: CardSource | null;
    /** Rows removed or reset, per table. */
    affected: Record<string, number>;
}

export interface LearnerPath {
    userLoginId: string;
    enrollment: {
        enrolledAt: string;
        startUnit: { id: string; title: string } | null;
    } | null;
    progress: {
        lessonsDone: number;
        /** Lessons in the active release. */
        lessonsTotal: number;
        stage: { id: string; cefr: string; title: string } | null;
    };
    /** Newest first. */
    completions: {
        lessonId: string;
        title: string;
        unitTitle: string | null;
        timesCompleted: number;
        bestScore: number | null;
        firstCompletedAt: string;
        lastCompletedAt: string;
    }[];
    /** The latest 50, newest first. */
    checkpointAttempts: {
        unitTitle: string | null;
        scorePercent: number;
        passed: boolean;
        createdAt: string;
    }[];
    /** The latest 50, newest first. */
    placements: {
        scorePercent: number;
        placedUnitTitle: string | null;
        createdAt: string;
    }[];
}

export interface PathResetResult {
    affected: Record<string, number>;
}
