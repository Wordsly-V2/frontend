"use client";

import { dailyGoalProgress, getDailyHabit, DAILY_GOAL_WORDS } from "@/lib/daily-habit";
import { Flame, Target } from "lucide-react";
import { startTransition, useEffect, useState } from "react";

export function DailyHabitCard() {
    const [habit, setHabit] = useState(() => getDailyHabit());

    useEffect(() => {
        startTransition(() => setHabit(getDailyHabit()));
    }, []);

    const goal = dailyGoalProgress(habit);

    return (
        <section
            aria-label="Daily practice goal"
            className="mb-6 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm sm:p-5"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Daily habit
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {goal.met
                            ? "You hit your goal today. Nice work!"
                            : `Practice ${DAILY_GOAL_WORDS} words a day to build a streak.`}
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-2 rounded-xl bg-orange-500/10 px-3 py-2">
                        <Flame className="h-5 w-5 text-orange-500" aria-hidden />
                        <div>
                            <p className="text-xs text-muted-foreground">Streak</p>
                            <p className="text-lg font-bold tabular-nums leading-none">{habit.streak}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 min-w-[7rem]">
                        <Target className="h-5 w-5 text-primary" aria-hidden />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Today</p>
                            <p className="text-lg font-bold tabular-nums leading-none">
                                {habit.wordsToday}/{goal.goal}
                            </p>
                            <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-primary transition-all duration-500"
                                    style={{ width: `${goal.percent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/** Hook to refresh daily habit display after practice completes. */
export function useDailyHabitRefreshKey(): [number, () => void] {
    const [key, setKey] = useState(0);
    return [key, () => setKey((k) => k + 1)];
}
