"use client";

import { StreakFlame } from "@/components/common/motion";
import { DailyHabitActivityStrip } from "@/components/features/learn/daily-habit-activity-strip";
import { LevelBadge } from "@/components/features/learn/level-badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dailyGoalProgress, getLocalDailyHabit, localDateString } from "@/lib/daily-habit";
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
import { AlertTriangle, Award, CalendarDays, ChevronDown, Snowflake, Sparkles, Target, Trophy } from "lucide-react";
import type { ReactNode } from "react";

export function DailyHabitCard() {
    const clientDate = localDateString();
    const { habit: serverHabit, isLoading } = useDailyHabitDisplay();
    const habit = serverHabit ?? getLocalDailyHabit();
    const goal = dailyGoalProgress(habit.wordsToday, habit.goal);
    const updateGoal = useUpdateDailyGoalMutation();

    const showAtRisk = habit.streakAtRisk && !habit.goalMetToday;
    const milestone = habit.nextMilestone;
    const showMilestone =
        milestone != null && habit.streak > 0 && milestone - habit.streak <= 5;
    const milestoneProgress =
        milestone != null ? Math.round((habit.streak / milestone) * 100) : 0;

    return (
        <section aria-label="Daily practice goal" className="mb-6 space-y-3">
            {/* Compact stat strip — small glass tiles */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3">
                <GlassStat
                    icon={
                        <StreakFlame
                            className="h-4 w-4"
                            lit={habit.streak > 0}
                        />
                    }
                    label="Streak"
                    value={habit.streak}
                    suffix="d"
                />
                <GlassStat
                    icon={<Trophy className="h-4 w-4 text-amber-500" aria-hidden />}
                    label="Best streak"
                    value={habit.longestStreak}
                    suffix="d"
                />
                <GlassStat
                    icon={<Award className="h-4 w-4 text-primary" aria-hidden />}
                    label="Goal streak"
                    value={habit.goalStreak}
                    suffix="d"
                />
                <GlassStat
                    icon={
                        <CalendarDays className="h-4 w-4 text-[var(--brand-secondary)]" aria-hidden />
                    }
                    label="This week"
                    value={habit.wordsThisWeek}
                    suffix="w"
                />
            </div>

            <LevelBadge />

            {showAtRisk && (
                <div
                    role="alert"
                    className="flex items-center gap-2 rounded-2xl border border-[var(--brand-orange)]/40 bg-[var(--brand-orange)]/10 px-3 py-2 text-sm font-medium text-orange-700 dark:text-orange-300"
                >
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                    <span>
                        Your {habit.streak}-day streak ends tonight — practice now
                        to keep it alive.
                    </span>
                </div>
            )}

            {/* Habit details panel */}
            <div className="glass-surface rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Daily habit
                            </p>
                            {habit.goalMetToday && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary animate-pop">
                                    <Sparkles className="h-3 w-3" aria-hidden />
                                    Goal met
                                </span>
                            )}
                            {habit.streakShielded && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
                                    <Snowflake className="h-3 w-3" aria-hidden />
                                    Streak shielded
                                </span>
                            )}
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 rounded-lg text-xs"
                                    disabled={updateGoal.isPending}
                                >
                                    <Target className="h-3.5 w-3.5" aria-hidden />
                                    Daily goal: {habit.goal} words
                                    <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[8rem]">
                                {DAILY_GOAL_OPTIONS.map((value) => (
                                    <DropdownMenuItem
                                        key={value}
                                        disabled={value === habit.goal || updateGoal.isPending}
                                        onClick={() => updateGoal.mutate({ dailyGoal: value })}
                                    >
                                        {value} words
                                        {value === habit.goal ? " ✓" : ""}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        {isLoading && !serverHabit
                            ? "Loading your progress…"
                            : habit.message}
                    </p>

                    <div>
                        <div className="mb-2 flex items-end justify-between gap-3">
                            <p className="text-2xl font-bold tabular-nums leading-none">
                                {habit.wordsToday}
                                <span className="text-base font-medium text-muted-foreground">
                                    /{goal.goal} today
                                </span>
                            </p>
                            <p className="text-xs text-muted-foreground tabular-nums">
                                {goal.met
                                    ? "Done"
                                    : `${goal.remaining} to go · ${habit.daysActiveThisWeek}/7 days active`}
                            </p>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                                className="gradient-brand h-full rounded-full transition-all duration-500 motion-reduce:transition-none"
                                style={{ width: `${goal.percent}%` }}
                            />
                        </div>
                    </div>

                    {showMilestone && milestone != null && (
                        <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
                            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                                <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                                    <Award className="h-3.5 w-3.5" aria-hidden />
                                    {milestone - habit.streak === 0
                                        ? `${milestone}-day milestone reached!`
                                        : `${milestone - habit.streak} day${milestone - habit.streak === 1 ? "" : "s"} to a ${milestone}-day streak`}
                                </span>
                                <span className="tabular-nums text-muted-foreground">
                                    {habit.streak}/{milestone}
                                </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-primary/15">
                                <div
                                    className="h-full rounded-full bg-primary transition-all duration-500 motion-reduce:transition-none"
                                    style={{ width: `${milestoneProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <FreezeMeter
                        freezes={habit.streakFreezes}
                        goalStreak={habit.goalStreak}
                        shielded={habit.streakShielded}
                    />

                    <DailyHabitActivityStrip
                        days={habit.recentDays}
                        today={clientDate}
                    />

                    {habit.totalPracticeDays > 0 && (
                        <p className="text-xs text-muted-foreground">
                            Lifetime: {habit.totalWordsPracticed.toLocaleString()} words across{" "}
                            {habit.totalPracticeDays} practice day
                            {habit.totalPracticeDays === 1 ? "" : "s"}
                            {habit.longestGoalStreak > 0 &&
                                ` · best goal streak ${habit.longestGoalStreak}`}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}

function FreezeMeter({
    freezes,
    goalStreak,
    shielded,
}: Readonly<{ freezes: number; goalStreak: number; shielded: boolean }>) {
    const untilNext = goalDaysUntilNextFreeze(goalStreak, freezes);
    return (
        <div className="rounded-xl border border-[var(--brand-secondary)]/30 bg-[var(--brand-secondary)]/10 p-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span
                        className="flex items-center gap-0.5"
                        role="img"
                        aria-label={`${freezes} of ${MAX_STREAK_FREEZES} streak freezes banked`}
                    >
                        {Array.from({ length: MAX_STREAK_FREEZES }, (_, i) => (
                            <Snowflake
                                key={i}
                                className={
                                    i < freezes
                                        ? "h-4 w-4 text-sky-500"
                                        : "h-4 w-4 text-sky-500/25"
                                }
                                aria-hidden
                            />
                        ))}
                    </span>
                    <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                        {freezes}/{MAX_STREAK_FREEZES} streak freezes
                    </span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                    {shielded
                        ? "Shielding your streak"
                        : untilNext == null
                          ? "Freezes full"
                          : `${untilNext} goal-day${untilNext === 1 ? "" : "s"} to next`}
                </span>
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                A freeze auto-protects your streak on a missed day. Earn one
                after a 3-day goal streak and another at 5.
            </p>
        </div>
    );
}

/** Small glass stat tile for the dashboard strip. */
function GlassStat({
    icon,
    label,
    value,
    suffix,
    className,
}: Readonly<{
    icon: ReactNode;
    label: string;
    value: number;
    suffix?: string;
    className?: string;
}>) {
    return (
        <div
            className={cn(
                "glass-surface flex items-center gap-2 rounded-2xl px-3 py-2",
                className,
            )}
        >
            {icon}
            <div className="min-w-0">
                <p className="text-[10px] leading-none text-muted-foreground">
                    {label}
                </p>
                <p className="text-lg font-bold tabular-nums leading-tight">
                    {value}
                    {suffix && (
                        <span className="text-xs font-medium text-muted-foreground">
                            {suffix}
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}
