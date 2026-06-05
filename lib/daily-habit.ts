import { getLocalStorageItem, setLocalStorageItem } from "@/lib/local-storage";

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

function todayDateString(): string {
    return new Date().toISOString().slice(0, 10);
}

function yesterdayDateString(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
}

function defaultState(): DailyHabitState {
    return {
        date: todayDateString(),
        wordsToday: 0,
        streak: 0,
        lastPracticeDate: null,
    };
}

export function getDailyHabit(): DailyHabitState {
    if (globalThis.window === undefined) return defaultState();
    try {
        const raw = getLocalStorageItem(DAILY_HABIT_STORAGE_KEY);
        if (!raw) return defaultState();
        const parsed = JSON.parse(raw) as Partial<DailyHabitState>;
        const today = todayDateString();
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

/** Record words practiced and update streak. Returns updated state. */
export function recordPracticeWords(wordCount: number): DailyHabitState {
    if (wordCount <= 0) return getDailyHabit();

    const today = todayDateString();
    const yesterday = yesterdayDateString();
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

export function dailyGoalProgress(state: DailyHabitState): {
    goal: number;
    done: number;
    percent: number;
    met: boolean;
} {
    const goal = DAILY_GOAL_WORDS;
    const done = Math.min(state.wordsToday, goal);
    const percent = goal > 0 ? Math.min(100, (state.wordsToday / goal) * 100) : 0;
    return { goal, done, percent, met: state.wordsToday >= goal };
}
