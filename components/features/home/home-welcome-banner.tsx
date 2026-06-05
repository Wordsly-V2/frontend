"use client";

import { ContinueCourseButton } from "@/components/common/continue-course-button";
import { SectionHeaderRow } from "@/components/common/section-header-row";
import { Button } from "@/components/ui/button";
import { dailyGoalProgress, getLocalDailyHabit } from "@/lib/daily-habit";
import { getLastLearnCourse } from "@/lib/learning-session";
import { LONG_TEXT_WRAP } from "@/lib/long-text";
import { useDailyHabitDisplay } from "@/queries/daily-habit.query";
import { Flame, Target } from "lucide-react";
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
            <SectionHeaderRow
                actions={
                    <>
                        {lastCourse && (
                            <ContinueCourseButton
                                courseId={lastCourse.id}
                                courseName={lastCourse.name}
                            />
                        )}
                        <Button variant="outline" className="w-full rounded-xl shrink-0" asChild>
                            <Link href="/learn">Open Learn</Link>
                        </Button>
                    </>
                }
            >
                <p className={`text-sm font-medium ${LONG_TEXT_WRAP}`}>
                    Welcome back, {firstName}
                </p>
                <p className={`mt-2 text-sm text-muted-foreground ${LONG_TEXT_WRAP}`}>
                    {goal.met
                        ? "Daily goal done — nice work today."
                        : `${goal.remaining} word${goal.remaining === 1 ? "" : "s"} left to hit your daily goal.`}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-2.5 py-1 text-xs font-semibold tabular-nums">
                        <Flame className="h-3.5 w-3.5 text-orange-500" aria-hidden />
                        {habit.streak}-day streak
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold tabular-nums">
                        <Target className="h-3.5 w-3.5 text-primary" aria-hidden />
                        {habit.wordsToday}/{goal.goal} today
                    </span>
                </div>
            </SectionHeaderRow>
        </div>
    );
}
