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

                {/* Progress — surfaced above the course list */}
                <section className="glass-surface mb-8 rounded-3xl">
                    <h2 className="px-5 py-4 font-display text-base font-bold">
                        Your progress
                    </h2>
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
                </section>

                <CoursePath />
            </div>
        </main>
    );
}
