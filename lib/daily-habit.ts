import { getLocalStorageItem, setLocalStorageItem } from "@/lib/local-storage";
import type { IDailyHabit } from "@/types/daily-habit/daily-habit.type";

export const DAILY_GOAL_WORDS = 10;
export const DAILY_HABIT_STORAGE_KEY = "wordsly.dailyHabit";

export interface DailyHabitState {
    /** Local calendar date YYYY-MM-DD for wordsToday */
    date: string;
    wordsToday: number;
    streak: number;
    /** Last calendar date the learner completed at least 1 word */
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

function defaultState(): DailyHabitState {
    return {
        date: localDateString(),
        wordsToday: 0,
        streak: 0,
        lastPracticeDate: null,
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
        setLocalStorageItem(DAILY_HABIT_STORAGE_KEY, JSON.stringify(toDailyHabitState(habit)));
    } catch {
        // ignore
    }
}

export function getDailyHabit(): DailyHabitState {
    if (globalThis.window === undefined) return defaultState();
    try {
        const raw = getLocalStorageItem(DAILY_HABIT_STORAGE_KEY);
        if (!raw) return defaultState();
        const parsed = JSON.parse(raw) as Partial<DailyHabitState>;
        const today = localDateString();
        if (parsed.date !== today) {
            return {
                date: today,
                wordsToday: 0,
                streak: typeof parsed.streak === "number" ? parsed.streak : 0,
                lastPracticeDate:
                    typeof parsed.lastPracticeDate === "string" ? parsed.lastPracticeDate : null,
            };
        }
        return {
            date: today,
            wordsToday: typeof parsed.wordsToday === "number" ? parsed.wordsToday : 0,
            streak: typeof parsed.streak === "number" ? parsed.streak : 0,
            lastPracticeDate:
                typeof parsed.lastPracticeDate === "string" ? parsed.lastPracticeDate : null,
        };
    } catch {
        return defaultState();
    }
}

/** Offline fallback: record words locally when the API is unavailable. */
export function recordPracticeWordsLocally(wordCount: number): DailyHabitState {
    if (wordCount <= 0) return getDailyHabit();

    const today = localDateString();
    const yesterday = yesterdayDateString(today);
    const current = getDailyHabit();

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

    const next: DailyHabitState = {
        date: today,
        wordsToday: current.wordsToday + wordCount,
        streak,
        lastPracticeDate: today,
    };

    try {
        setLocalStorageItem(DAILY_HABIT_STORAGE_KEY, JSON.stringify(next));
    } catch {
        // ignore
    }

    return next;
}

export function dailyGoalProgress(
    state: DailyHabitState,
    goal = DAILY_GOAL_WORDS,
): {
    goal: number;
    done: number;
    percent: number;
    met: boolean;
} {
    const done = Math.min(state.wordsToday, goal);
    const percent = goal > 0 ? Math.min(100, (state.wordsToday / goal) * 100) : 0;
    return { goal, done, percent, met: state.wordsToday >= goal };
}
