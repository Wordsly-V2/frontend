"use client";

import { LearningProgressChart } from "@/components/common/learning-progress-chart";
import { StatsCards } from "@/components/common/stats-cards";
import LearningProgressSection from "@/components/common/word-progress-stats/learning-progress-section";
import { CoursePath } from "@/components/features/learn/course-path";
import { DailyHabitCard } from "@/components/features/learn/daily-habit-card";
import { DailyHero } from "@/components/features/learn/daily-hero";
import {
    useGetMyCoursesTotalStatsQuery,
} from "@/queries/courses.query";
import { useGetProgressStatsQuery } from "@/queries/word-progress.query";
import { ChevronDown } from "lucide-react";

export default function LearnPage() {
    const {
        data: courseTotalStats,
        isLoading: isLoadingCourseTotalStats,
        isError: isErrorCourseTotalStats,
        refetch: refetchCourseTotalStats,
    } = useGetMyCoursesTotalStatsQuery();
    const isLoadingStats =
        isLoadingCourseTotalStats ||
        isErrorCourseTotalStats ||
        !courseTotalStats;
    const {
        data: wordProgressStats,
        isLoading: isLoadingProgressStats,
        isError: isErrorProgressStats,
        refetch: refetchProgressStats,
    } = useGetProgressStatsQuery(undefined, undefined, true);

    return (
        <main className="min-h-dvh">
            <div className="container mx-auto max-w-5xl px-3 pb-24 pt-5 sm:px-4 sm:pb-12 sm:pt-6 md:py-8">
                <DailyHero />

                <DailyHabitCard />

                <CoursePath />

                {/* Progress — kept below the fold for the curious */}
                <details className="group glass-surface rounded-3xl">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-3xl px-5 py-4 font-display text-base font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45">
                        Your progress
                        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="space-y-6 px-5 pb-5">
                        <StatsCards
                            items={courseTotalStats}
                            isLoading={isLoadingStats}
                            isError={isErrorCourseTotalStats}
                            onCardClick={() => {
                                if (isErrorCourseTotalStats)
                                    refetchCourseTotalStats();
                            }}
                        />
                        <LearningProgressSection
                            stats={wordProgressStats}
                            title="Learning Progress (All Courses)"
                            isLoading={isLoadingProgressStats}
                            isError={isErrorProgressStats}
                            onCardClick={() => {
                                if (isLoadingProgressStats || isErrorProgressStats)
                                    refetchProgressStats();
                            }}
                        />
                        <LearningProgressChart
                            stats={wordProgressStats}
                            isLoading={isLoadingProgressStats}
                            isError={isErrorProgressStats}
                        />
                    </div>
                </details>
            </div>
        </main>
    );
}
