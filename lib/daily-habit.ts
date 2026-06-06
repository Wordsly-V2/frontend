import { getLocalStorageItem, setLocalStorageItem } from "@/lib/local-storage";
import type { IDailyHabit, IDailyHabitDay } from "@/types/daily-habit/daily-habit.type";

import { PEDAGOGY } from "@/lib/learning-pedagogy";

export const DAILY_GOAL_WORDS = PEDAGOGY.dailyNewWordGoal;
export const DAILY_HABIT_STORAGE_KEY = "wordsly.dailyHabit";

/** @deprecated Use IDailyHabit — kept for practice summary compatibility */
export interface DailyHabitState {
    date: string;
    wordsToday: number;
    streak: number;
    lastPracticeDate: string | null;
}

/** Client local calendar date (not UTC). */
export function localDateString(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function yesterdayDateString(fromDate = localDateString()): string {
    const [year, month, day] = fromDate.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() - 1);
    return localDateString(d);
}

function emptyRecentDays(endDate = localDateString()): IDailyHabitDay[] {
    return Array.from({ length: 7 }, (_, index) => {
        const [y, m, day] = endDate.split("-").map(Number);
        const date = new Date(y, m - 1, day);
        date.setDate(date.getDate() - (6 - index));
        return {
            date: localDateString(date),
            words: 0,
            goalMet: false,
        };
    });
}

export function emptyLocalDailyHabit(date = localDateString()): IDailyHabit {
    return {
        date,
        wordsToday: 0,
        streak: 0,
        longestStreak: 0,
        goalStreak: 0,
        longestGoalStreak: 0,
        lastPracticeDate: null,
        goal: DAILY_GOAL_WORDS,
        goalMetToday: false,
        totalWordsPracticed: 0,
        totalPracticeDays: 0,
        wordsThisWeek: 0,
        daysActiveThisWeek: 0,
        recentDays: emptyRecentDays(date),
        message: `Practice ${DAILY_GOAL_WORDS} words a day to build your streak.`,
    };
}

export function toDailyHabitState(habit: IDailyHabit): DailyHabitState {
    return {
        date: habit.date,
        wordsToday: habit.wordsToday,
        streak: habit.streak,
        lastPracticeDate: habit.lastPracticeDate,
    };
}

export function cacheDailyHabitLocally(habit: IDailyHabit): void {
    if (globalThis.window === undefined) return;
    try {
        setLocalStorageItem(DAILY_HABIT_STORAGE_KEY, JSON.stringify(habit));
    } catch {
        // ignore
    }
}

export function getLocalDailyHabit(): IDailyHabit {
    if (globalThis.window === undefined) return emptyLocalDailyHabit();
    try {
        const raw = getLocalStorageItem(DAILY_HABIT_STORAGE_KEY);
        if (!raw) return emptyLocalDailyHabit();
        const parsed = JSON.parse(raw) as Partial<IDailyHabit>;
        const today = localDateString();
        const base = emptyLocalDailyHabit(today);

        if (parsed.date !== today) {
            return {
                ...base,
                streak: typeof parsed.streak === "number" ? parsed.streak : 0,
                longestStreak:
                    typeof parsed.longestStreak === "number" ? parsed.longestStreak : 0,
                goalStreak: typeof parsed.goalStreak === "number" ? parsed.goalStreak : 0,
                longestGoalStreak:
                    typeof parsed.longestGoalStreak === "number"
                        ? parsed.longestGoalStreak
                        : 0,
                lastPracticeDate:
                    typeof parsed.lastPracticeDate === "string"
                        ? parsed.lastPracticeDate
                        : null,
                goal: typeof parsed.goal === "number" ? parsed.goal : DAILY_GOAL_WORDS,
                totalWordsPracticed:
                    typeof parsed.totalWordsPracticed === "number"
                        ? parsed.totalWordsPracticed
                        : 0,
                totalPracticeDays:
                    typeof parsed.totalPracticeDays === "number"
                        ? parsed.totalPracticeDays
                        : 0,
            };
        }

        return { ...base, ...parsed, date: today };
    } catch {
        return emptyLocalDailyHabit();
    }
}

/** @deprecated Use getLocalDailyHabit */
export function getDailyHabit(): DailyHabitState {
    return toDailyHabitState(getLocalDailyHabit());
}

/** Offline fallback: record words locally when the API is unavailable. */
export function recordPracticeWordsLocally(wordCount: number): IDailyHabit {
    if (wordCount <= 0) return getLocalDailyHabit();

    const today = localDateString();
    const yesterday = yesterdayDateString(today);
    const current = getLocalDailyHabit();
    const goal = current.goal;

    let streak = current.streak;
    const last = current.lastPracticeDate;

    if (last !== today) {
        if (last === yesterday) {
            streak += 1;
        } else if (last == null) {
            streak = 1;
        } else {
            streak = 1;
        }
    } else if (last == null) {
        streak = Math.max(streak, 1);
    }

    const wordsToday = current.wordsToday + wordCount;
    const goalMetToday = wordsToday >= goal;
    let goalStreak = current.goalStreak;
    if (goalMetToday && !current.goalMetToday) {
        goalStreak =
            current.lastPracticeDate === yesterday ? current.goalStreak + 1 : 1;
    }

    const recentDays = current.recentDays.map((day) =>
        day.date === today
            ? { ...day, words: day.words + wordCount, goalMet: goalMetToday }
            : day,
    );

    const next: IDailyHabit = {
        ...current,
        date: today,
        wordsToday,
        streak,
        longestStreak: Math.max(current.longestStreak, streak),
        goalStreak,
        longestGoalStreak: Math.max(current.longestGoalStreak, goalStreak),
        lastPracticeDate: today,
        goalMetToday,
        totalWordsPracticed: current.totalWordsPracticed + wordCount,
        wordsThisWeek: recentDays.reduce((sum, d) => sum + d.words, 0),
        daysActiveThisWeek: recentDays.filter((d) => d.words > 0).length,
        recentDays,
        message: goalMetToday
            ? "Daily goal complete. Keep the momentum going!"
            : `Practice ${goal} words a day to build your streak.`,
    };

    cacheDailyHabitLocally(next);
    return next;
}

export function dailyGoalProgress(
    wordsToday: number,
    goal: number = DAILY_GOAL_WORDS,
): {
    goal: number;
    done: number;
    percent: number;
    met: boolean;
    remaining: number;
} {
    const done = Math.min(wordsToday, goal);
    const percent = goal > 0 ? Math.min(100, (wordsToday / goal) * 100) : 0;
    const remaining = Math.max(0, goal - wordsToday);
    return { goal, done, percent, met: wordsToday >= goal, remaining };
}
