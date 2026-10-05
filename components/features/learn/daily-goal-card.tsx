"use client";

import { CountUp, StreakFlame } from "@/components/common/motion";
import { DailyHabitActivityStrip } from "@/components/features/learn/daily-habit-activity-strip";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dailyGoalProgress, getLocalDailyHabit, localDateString } from "@/lib/daily-habit";
import { cn } from "@/lib/utils";
import { useDailyHabitDisplay, useUpdateDailyGoalMutation } from "@/queries/daily-habit.query";
import {
    DAILY_GOAL_OPTIONS,
    FREEZE_FIRST_EARN_GOAL_DAYS,
    FREEZE_REPEAT_EARN_GOAL_DAYS,
    MAX_STREAK_FREEZES,
} from "@/types/daily-habit/daily-habit.type";
import { AlertTriangle, Award, CalendarDays, ChevronDown, Snowflake, Trophy } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Today's goal, streak and the week, in one card: the right rail of /learn on
 * desktop, second on the page on mobile. Owns the daily-goal picker.
 */
export function DailyGoalCard({ className }: Readonly<{ className?: string }>) {
    const clientDate = localDateString();
    const { habit: serverHabit, isLoading } = useDailyHabitDisplay();
    const habit = serverHabit ?? getLocalDailyHabit();
    const goal = dailyGoalProgress(habit.wordsToday, habit.goal);
    const updateGoal = useUpdateDailyGoalMutation();
    /** No server habit means these numbers are a local guess. */
    const isProvisional = !serverHabit;
    const atRisk = habit.streakAtRisk && !habit.goalMetToday;

    const milestone = habit.nextMilestone;
    const showMilestone = milestone != null && habit.streak > 0 && milestone - habit.streak <= 5;

    return (
        <section aria-label="Daily goal" className={cn("rounded-3xl border border-border/70 bg-card p-5 shadow-sm", className)}>
            <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold">Daily goal</h2>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 rounded-full px-3 text-xs"
                            disabled={updateGoal.isPending}
                            aria-label={`Daily goal: ${habit.goal} words. Change`}
                        >
                            {habit.goal} words
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
                                {value} words{value === habit.goal ? " ✓" : ""}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="mt-4 flex items-center gap-4">
                <GoalRing percent={goal.percent} met={goal.met} done={habit.wordsToday} goal={goal.goal} />
                <div className="min-w-0 flex-1">
                    <p className="font-display text-3xl font-bold leading-none tabular-nums">
                        <CountUp value={habit.wordsToday} />
                        <span className="text-base font-semibold text-muted-foreground">/{goal.goal}</span>
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                        {goal.met ? "Goal done for today 🎉" : `${goal.remaining} words to go`}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                        {isLoading && !serverHabit ? "Loading your progress…" : habit.message}
                    </p>
                </div>
            </div>

            {atRisk && (
                <p
                    role="alert"
                    className="mt-4 flex items-start gap-2 rounded-2xl border border-[var(--brand-orange)]/40 bg-[var(--brand-orange)]/10 px-3 py-2 text-xs font-semibold text-orange-700 dark:text-orange-300"
                >
                    <AlertTriangle className="mt-px h-4 w-4 shrink-0" aria-hidden />
                    Your {habit.streak}-day streak ends tonight. Practice now to keep it.
                </p>
            )}

            {showMilestone && milestone != null && (
                <div className="mt-4 rounded-2xl bg-primary/8 p-3 dark:bg-primary/12">
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                            <Award className="h-3.5 w-3.5" aria-hidden />
                            {milestone === habit.streak
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
                            style={{ width: `${Math.round((habit.streak / milestone) * 100)}%` }}
                        />
                    </div>
                </div>
            )}

            <DailyHabitActivityStrip days={habit.recentDays} today={clientDate} className="mt-5" />

            {/* The streak is in the top bar on small screens; the full set is for the rail. */}
            <dl className="mt-5 hidden grid-cols-2 gap-2 lg:grid">
                <Fact icon={<StreakFlame className="h-4 w-4" lit={habit.streak > 0} />} label="Streak" value={`${habit.streak}d`} />
                <Fact icon={<Trophy className="h-4 w-4 text-amber-500" aria-hidden />} label="Best streak" value={`${habit.longestStreak}d`} />
                <Fact icon={<Award className="h-4 w-4 text-primary" aria-hidden />} label="Goal streak" value={`${habit.goalStreak}d`} />
                <Fact
                    icon={<CalendarDays className="h-4 w-4 text-[var(--brand-secondary)]" aria-hidden />}
                    label="This week"
                    value={`${habit.wordsThisWeek}`}
                />
            </dl>

            <div
                className="mt-3 flex items-center gap-2 rounded-2xl bg-sky-500/8 px-3 py-2"
                title={`A freeze protects your streak on a missed day. Earn one after ${FREEZE_FIRST_EARN_GOAL_DAYS} goal days, then one every ${FREEZE_REPEAT_EARN_GOAL_DAYS} goal days.`}
            >
                <span
                    className="flex items-center gap-0.5"
                    role="img"
                    aria-label={`${habit.streakFreezes} of ${MAX_STREAK_FREEZES} streak freezes`}
                >
                    {Array.from({ length: MAX_STREAK_FREEZES }, (_, i) => (
                        <Snowflake
                            key={i}
                            className={cn("h-4 w-4", i < habit.streakFreezes ? "text-sky-500" : "text-sky-500/25")}
                            aria-hidden
                        />
                    ))}
                </span>
                <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                    {habit.streakFreezes}/{MAX_STREAK_FREEZES} freezes
                </span>
                <span className="ml-auto text-[11px] text-muted-foreground">
                    {habit.streakShielded
                        ? "Protecting your streak"
                        : habit.goalDaysUntilNextFreeze == null
                          ? "Full"
                          : `${habit.goalDaysUntilNextFreeze} goal-day${habit.goalDaysUntilNextFreeze === 1 ? "" : "s"} to next`}
                </span>
            </div>

            {habit.totalPracticeDays > 0 && (
                <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
                    Lifetime: {habit.totalGoalDays} goal day{habit.totalGoalDays === 1 ? "" : "s"} ·{" "}
                    {habit.totalPracticeDays} practice day{habit.totalPracticeDays === 1 ? "" : "s"} ·{" "}
                    {habit.totalWordsPracticed.toLocaleString()} words
                </p>
            )}
            {isProvisional && (
                // Offline these come from a local estimate. Streaks are the numbers
                // learners care most about, so they must never look settled.
                <p className="mt-2 text-[11px] text-muted-foreground">
                    Provisional — confirmed when you&apos;re back online.
                </p>
            )}
        </section>
    );
}

function Fact({ icon, label, value }: Readonly<{ icon: ReactNode; label: string; value: string }>) {
    return (
        <div className="flex items-center gap-2 rounded-2xl bg-muted/50 px-3 py-2 dark:bg-muted/30">
            {icon}
            <div className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
                <dd className="text-base font-bold leading-tight tabular-nums">{value}</dd>
            </div>
        </div>
    );
}

/** Radial daily-goal progress with a motion-animated fill. */
function GoalRing({
    percent,
    met,
    done,
    goal,
}: Readonly<{ percent: number; met: boolean; done: number; goal: number }>) {
    const reduce = useReducedMotion();
    const r = 40;
    const c = 2 * Math.PI * r;
    const offset = c - (Math.min(100, percent) / 100) * c;

    return (
        <div
            role="progressbar"
            aria-valuenow={Math.min(100, Math.round(percent))}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Daily goal: ${done} of ${goal} words practiced today`}
            className="relative flex h-24 w-24 shrink-0 items-center justify-center"
        >
            <svg className="h-full w-full -rotate-90" viewBox="0 0 96 96" aria-hidden>
                <circle cx="48" cy="48" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
                <motion.circle
                    cx="48"
                    cy="48"
                    r={r}
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    initial={reduce ? false : { strokeDashoffset: c }}
                    animate={{ strokeDashoffset: offset }}
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 55, damping: 16 }}
                    className={met ? "stroke-[var(--brand-success)]" : "stroke-primary"}
                />
            </svg>
            <StreakFlame className="absolute h-8 w-8" lit={met} />
        </div>
    );
}
