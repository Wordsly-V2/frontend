"use client";

import { StreakFlame } from "@/components/common/motion";
import { NothingDueState } from "@/components/features/learn/nothing-due-state";
import { Button } from "@/components/ui/button";
import { useNextPracticeAction } from "@/hooks/useNextPracticeAction.hook";
import { useUser } from "@/hooks/useUser.hook";
import { getLocalDailyHabit } from "@/lib/daily-habit";
import { cn } from "@/lib/utils";
import { useDailyHabitDisplay } from "@/queries/daily-habit.query";
import { Brain, Play, Sparkles } from "lucide-react";
import Link from "next/link";

function greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
}

export function DailyHero() {
    const { profile } = useUser();
    const { habit: serverHabit } = useDailyHabitDisplay();
    const habit = serverHabit ?? getLocalDailyHabit();
    const next = useNextPracticeAction();
    const firstName = profile?.displayName?.split(" ")[0] ?? "there";
    const { goal } = next;

    return (
        <section
            aria-label="Today's practice"
            className="mb-6 overflow-hidden rounded-3xl border-2 border-border bg-card p-5 shadow-chunky sm:p-7"
        >
            {next.allCaughtUp && next.last ? (
                <NothingDueState next={next} />
            ) : (
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border-2 border-border bg-card px-2.5 py-0.5 text-xs font-extrabold tabular-nums">
                                <StreakFlame
                                    className="h-3.5 w-3.5"
                                    lit={habit.streak > 0}
                                />
                                {habit.streak}-day streak
                            </span>
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-muted-foreground">
                                {greeting()}, {firstName} 👋
                            </p>
                            <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">
                                {goal.met
                                    ? "Goal smashed — keep the momentum!"
                                    : next.primary
                                      ? "Ready for today's practice?"
                                      : "Pick a course to get started"}
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {next.primary ? (
                                <Button
                                    variant="play"
                                    size="xl"
                                    asChild
                                    disabled={next.wordsLoading}
                                >
                                    <Link
                                        href={next.primary.href}
                                        className="gap-2"
                                    >
                                        <Play className="h-5 w-5 fill-current" />
                                        {next.wordsLoading
                                            ? "Loading…"
                                            : "Start practice"}
                                    </Link>
                                </Button>
                            ) : (
                                <Button variant="play" size="xl" asChild>
                                    <Link
                                        href="/learn/courses"
                                        className="gap-2"
                                    >
                                        <Play className="h-5 w-5 fill-current" />
                                        Browse courses
                                    </Link>
                                </Button>
                            )}

                            {next.reviewDueHref &&
                                next.primary?.kind !== "review" && (
                                    <Button
                                        variant="playOutline"
                                        size="lg"
                                        asChild
                                    >
                                        <Link
                                            href={next.reviewDueHref}
                                            className="gap-1.5"
                                        >
                                            <Brain className="h-4 w-4" />
                                            Review {next.dueCount}
                                        </Link>
                                    </Button>
                                )}
                            {next.learnNewHref &&
                                next.primary?.kind !== "new" && (
                                    <Button
                                        variant="playOutline"
                                        size="lg"
                                        asChild
                                    >
                                        <Link
                                            href={next.learnNewHref}
                                            className="gap-1.5"
                                        >
                                            <Sparkles className="h-4 w-4" />
                                            Learn {next.newCount} new
                                        </Link>
                                    </Button>
                                )}
                        </div>
                    </div>

                    <GoalRing
                        percent={goal.percent}
                        done={habit.wordsToday}
                        goal={goal.goal}
                        met={goal.met}
                    />
                </div>
            )}
        </section>
    );
}

function GoalRing({
    percent,
    done,
    goal,
    met,
}: {
    percent: number;
    done: number;
    goal: number;
    met: boolean;
}) {
    const r = 52;
    const c = 2 * Math.PI * r;
    const offset = c - (Math.min(100, percent) / 100) * c;

    return (
        <div className="relative mx-auto flex h-36 w-36 shrink-0 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                <circle
                    cx="60"
                    cy="60"
                    r={r}
                    fill="none"
                    strokeWidth="12"
                    className="stroke-muted"
                />
                <circle
                    cx="60"
                    cy="60"
                    r={r}
                    fill="none"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    className={cn(
                        "transition-[stroke-dashoffset] duration-700",
                        met
                            ? "stroke-[var(--brand-success)]"
                            : "stroke-primary",
                    )}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="font-display text-2xl font-bold tabular-nums leading-none">
                    {done}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                    / {goal} words
                </span>
            </div>
        </div>
    );
}
