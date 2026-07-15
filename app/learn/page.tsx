"use client";

import { LearningProgressChart } from "@/components/common/learning-progress-chart";
import { StatsCards } from "@/components/common/stats-cards";
import LearningProgressSection from "@/components/common/word-progress-stats/learning-progress-section";
import { CoursePath } from "@/components/features/learn/course-path";
import { DailyHabitCard } from "@/components/features/learn/daily-habit-card";
import { DailyHero } from "@/components/features/learn/daily-hero";
import PracticeSettingsDialog from "@/components/features/vocabulary/practice-settings-dialog";
import { Button } from "@/components/ui/button";
import { isOnboardingDone } from "@/lib/onboarding";
import {
    useGetMyCoursesTotalStatsQuery,
} from "@/queries/courses.query";
import { useGetProgressStatsQuery } from "@/queries/word-progress.query";
import { Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LearnPage() {
    const router = useRouter();
    const [settingsOpen, setSettingsOpen] = useState(false);
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

    // First-run onboarding: once the stats resolve (never while loading/erroring),
    // a brand-new learner with no courses and no local "done" flag is sent to the
    // wizard. The wizard route lives at /learn/onboarding, so this never loops.
    useEffect(() => {
        if (isLoadingCourseTotalStats || isErrorCourseTotalStats || !courseTotalStats) {
            return;
        }
        if (courseTotalStats.totalCourses === 0 && !isOnboardingDone()) {
            router.replace("/learn/onboarding");
        }
    }, [isLoadingCourseTotalStats, isErrorCourseTotalStats, courseTotalStats, router]);

    const {
        data: wordProgressStats,
        isLoading: isLoadingProgressStats,
        isError: isErrorProgressStats,
        refetch: refetchProgressStats,
    } = useGetProgressStatsQuery(undefined, undefined, true);

    const progressStatsCards = (
        <StatsCards
            items={courseTotalStats}
            isLoading={isLoadingStats}
            isError={isErrorCourseTotalStats}
            onCardClick={() => {
                if (isErrorCourseTotalStats) refetchCourseTotalStats();
            }}
        />
    );
    const learningProgress = (
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
    );

    return (
        <main className="min-h-dvh">
            <div className="container mx-auto max-w-5xl px-3 pb-24 pt-5 sm:px-4 sm:pb-12 sm:pt-6 md:py-8">
                <div className="mb-3 flex justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-xl"
                        onClick={() => setSettingsOpen(true)}
                    >
                        <Settings2 className="h-4 w-4" aria-hidden />
                        Practice settings
                    </Button>
                </div>

                <DailyHero />

                <DailyHabitCard />

                {/* Progress — surfaced above the course list */}
                <section className="glass-surface mb-8 rounded-3xl">
                    <h2 className="px-5 py-4 font-display text-base font-bold">
                        Your progress
                    </h2>
                    <div className="space-y-6 px-5 pb-5">
                        {progressStatsCards}
                        {learningProgress}
                        <LearningProgressChart
                            stats={wordProgressStats}
                            isLoading={isLoadingProgressStats}
                            isError={isErrorProgressStats}
                        />
                    </div>
                </section>

                <CoursePath />
            </div>

            <PracticeSettingsDialog
                isOpen={settingsOpen}
                includeSessionPrefs
                onClose={() => setSettingsOpen(false)}
            />
        </main>
    );
}
