"use client";

import { DailyHabitActivityStrip } from "@/components/features/learn/daily-habit-activity-strip";
import { StreakFlame } from "@/components/common/motion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    dailyGoalProgress,
    getLocalDailyHabit,
    localDateString,
} from "@/lib/daily-habit";
import { cn } from "@/lib/utils";
import {
    useDailyHabitDisplay,
    useUpdateDailyGoalMutation,
} from "@/queries/daily-habit.query";
import {
    DAILY_GOAL_OPTIONS,
    MAX_STREAK_FREEZES,
    goalDaysUntilNextFreeze,
} from "@/types/daily-habit/daily-habit.type";
import { Snowflake } from "lucide-react";

/** Always-visible streak + daily-goal chip in the top nav. */
export function StreakChip({ className }: { className?: string }) {
    const clientDate = localDateString();
    const { habit: serverHabit } = useDailyHabitDisplay();
    const habit = serverHabit ?? getLocalDailyHabit();
    const goal = dailyGoalProgress(habit.wordsToday, habit.goal);
    const updateGoal = useUpdateDailyGoalMutation();
    const atRisk = habit.streakAtRisk && !habit.goalMetToday;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label={
                        atRisk
                            ? `Streak ${habit.streak} days at risk — practice today to keep it`
                            : `Streak ${habit.streak} days, ${habit.wordsToday} of ${goal.goal} words today`
                    }
                    className={cn(
                        "flex items-center gap-1.5 rounded-full border-2 bg-card px-2.5 py-1 text-sm font-extrabold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                        atRisk
                            ? "border-[var(--brand-orange)]/60 animate-pulse"
                            : "border-border hover:border-[var(--brand-orange)]/40",
                        className,
                    )}
                >
                    <StreakFlame className="h-4 w-4" lit={habit.streak > 0} />
                    <span>{habit.streak}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 rounded-2xl p-3">
                <DropdownMenuLabel className="px-1 pb-2">
                    <div className="flex items-center justify-between">
                        <span className="font-display text-base font-bold">
                            {habit.streak}-day streak
                        </span>
                        <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <span
                                className="inline-flex items-center gap-0.5 text-sky-600 dark:text-sky-400"
                                title={`${habit.streakFreezes} of ${MAX_STREAK_FREEZES} streak freezes banked`}
                            >
                                <Snowflake className="h-3 w-3" aria-hidden />
                                {habit.streakFreezes}/{MAX_STREAK_FREEZES}
                            </span>
                            best {habit.longestStreak}
                        </span>
                    </div>
                </DropdownMenuLabel>

                {atRisk && (
                    <p className="mb-2 rounded-lg border border-orange-400/40 bg-orange-400/10 px-2.5 py-1.5 text-xs font-medium text-orange-700 dark:text-orange-300">
                        Practice today to keep your {habit.streak}-day streak.
                    </p>
                )}

                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <div className="mb-1.5 flex items-end justify-between">
                        <p className="text-2xl font-bold tabular-nums leading-none">
                            {habit.wordsToday}
                            <span className="text-sm font-medium text-muted-foreground">
                                /{goal.goal}
                            </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {goal.met ? "Goal done 🎉" : `${goal.remaining} to go`}
                        </p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-[var(--brand-accent)] transition-all duration-500"
                            style={{ width: `${goal.percent}%` }}
                        />
                    </div>
                </div>

                <div className="px-1 py-3">
                    <DailyHabitActivityStrip
                        days={habit.recentDays}
                        today={clientDate}
                    />
                </div>

                <div className="mb-1 flex items-start gap-2 rounded-lg bg-sky-500/5 px-2.5 py-2 text-[11px] leading-snug text-muted-foreground">
                    <Snowflake
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500"
                        aria-hidden
                    />
                    <span>
                        <span className="font-semibold text-sky-700 dark:text-sky-300">
                            {habit.streakFreezes}/{MAX_STREAK_FREEZES} freezes
                        </span>{" "}
                        auto-protect your streak on a missed day.{" "}
                        {(() => {
                            const untilNext = goalDaysUntilNextFreeze(
                                habit.goalStreak,
                                habit.streakFreezes,
                            );
                            return untilNext == null
                                ? "Balance full."
                                : `${untilNext} more goal-day${untilNext === 1 ? "" : "s"} earns another.`;
                        })()}
                    </span>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="px-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Daily goal
                </DropdownMenuLabel>
                <div className="grid grid-cols-4 gap-1 px-1 pt-1">
                    {DAILY_GOAL_OPTIONS.map((value) => (
                        <DropdownMenuItem
                            key={value}
                            disabled={value === habit.goal || updateGoal.isPending}
                            onSelect={(e) => {
                                e.preventDefault();
                                updateGoal.mutate({ dailyGoal: value });
                            }}
                            className={cn(
                                "justify-center rounded-lg text-xs font-bold",
                                value === habit.goal &&
                                    "bg-primary/10 text-primary",
                            )}
                        >
                            {value}
                        </DropdownMenuItem>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
