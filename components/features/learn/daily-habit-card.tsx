"use client";

import { DailyHabitActivityStrip } from "@/components/features/learn/daily-habit-activity-strip";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dailyGoalProgress, getLocalDailyHabit, localDateString } from "@/lib/daily-habit";
import {
    useDailyHabitDisplay,
    useUpdateDailyGoalMutation,
} from "@/queries/daily-habit.query";
import { DAILY_GOAL_OPTIONS } from "@/types/daily-habit/daily-habit.type";
import { Award, CalendarDays, ChevronDown, Flame, Sparkles, Target, Trophy } from "lucide-react";
import type { ReactNode } from "react";

export function DailyHabitCard() {
    const clientDate = localDateString();
    const { habit: serverHabit, isLoading } = useDailyHabitDisplay();
    const habit = serverHabit ?? getLocalDailyHabit();
    const goal = dailyGoalProgress(habit.wordsToday, habit.goal);
    const updateGoal = useUpdateDailyGoalMutation();

    return (
        <section
            aria-label="Daily practice goal"
            className="mb-6 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm sm:p-5"
        >
            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Daily habit
                            </p>
                            {habit.goalMetToday && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                    <Sparkles className="h-3 w-3" aria-hidden />
                                    Goal met
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {isLoading && !serverHabit
                                ? "Loading your progress…"
                                : habit.message}
                        </p>
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
                            <DropdownMenuContent align="start" className="min-w-[8rem]">
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

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3 shrink-0">
                        <StatPill
                            icon={<Flame className="h-4 w-4 text-orange-500" />}
                            label="Streak"
                            value={habit.streak}
                            accent="bg-orange-500/10"
                        />
                        <StatPill
                            icon={<Trophy className="h-4 w-4 text-amber-500" />}
                            label="Best"
                            value={habit.longestStreak}
                            accent="bg-amber-500/10"
                        />
                        <StatPill
                            icon={<Award className="h-4 w-4 text-violet-500" />}
                            label="Goal streak"
                            value={habit.goalStreak}
                            accent="bg-violet-500/10"
                        />
                        <StatPill
                            icon={<CalendarDays className="h-4 w-4 text-primary" />}
                            label="This week"
                            value={habit.wordsThisWeek}
                            accent="bg-primary/10"
                            suffix="w"
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/20 p-3 sm:p-4">
                    <div className="mb-2 flex items-end justify-between gap-3">
                        <div>
                            <p className="text-xs text-muted-foreground">Today</p>
                            <p className="text-2xl font-bold tabular-nums leading-none">
                                {habit.wordsToday}
                                <span className="text-base font-medium text-muted-foreground">
                                    /{goal.goal}
                                </span>
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground tabular-nums">
                            {goal.met
                                ? "Done"
                                : `${goal.remaining} to go · ${habit.daysActiveThisWeek}/7 days active`}
                        </p>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-[var(--brand-accent)] transition-all duration-500"
                            style={{ width: `${goal.percent}%` }}
                        />
                    </div>
                </div>

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
        </section>
    );
}

function StatPill({
    icon,
    label,
    value,
    accent,
    suffix,
}: Readonly<{
    icon: ReactNode;
    label: string;
    value: number;
    accent: string;
    suffix?: string;
}>) {
    return (
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${accent}`}>
            {icon}
            <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
                <p className="text-lg font-bold tabular-nums leading-tight">
                    {value}
                    {suffix && (
                        <span className="text-xs font-medium text-muted-foreground">{suffix}</span>
                    )}
                </p>
            </div>
        </div>
    );
}
