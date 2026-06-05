"use client";

import { Button } from "@/components/ui/button";
import { dailyGoalProgress, getLocalDailyHabit } from "@/lib/daily-habit";
import { getLastLearnCourse } from "@/lib/learning-session";
import { useDailyHabitDisplay } from "@/queries/daily-habit.query";
import { BookOpen, Flame, Target } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface HomeWelcomeBannerProps {
    displayName: string;
}

export function HomeWelcomeBanner({ displayName }: Readonly<HomeWelcomeBannerProps>) {
    const firstName = displayName.split(" ")[0] ?? displayName;
    const { habit: serverHabit } = useDailyHabitDisplay();
    const habit = serverHabit ?? getLocalDailyHabit();
    const goal = dailyGoalProgress(habit.wordsToday, habit.goal);
    const [lastCourse, setLastCourse] = useState<ReturnType<typeof getLastLearnCourse>>(null);

    useEffect(() => {
        setLastCourse(getLastLearnCourse());
    }, []);

    return (
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-2">
                    <p className="text-sm font-medium">
                        Welcome back, {firstName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {goal.met
                            ? "Daily goal done — nice work today."
                            : `${goal.remaining} word${goal.remaining === 1 ? "" : "s"} left to hit your daily goal.`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-2.5 py-1 text-xs font-semibold tabular-nums">
                            <Flame className="h-3.5 w-3.5 text-orange-500" aria-hidden />
                            {habit.streak}-day streak
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold tabular-nums">
                            <Target className="h-3.5 w-3.5 text-primary" aria-hidden />
                            {habit.wordsToday}/{goal.goal} today
                        </span>
                    </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    {lastCourse && (
                        <Button className="rounded-xl gap-2 max-w-full" asChild>
                            <Link
                                href={`/learn/courses/${lastCourse.id}`}
                                title={`Continue: ${lastCourse.name}`}
                                className="max-w-full"
                            >
                                <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                                <span className="truncate">
                                    Continue: {lastCourse.name}
                                </span>
                            </Link>
                        </Button>
                    )}
                    <Button variant="outline" className="rounded-xl" asChild>
                        <Link href="/learn">Open Learn</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
