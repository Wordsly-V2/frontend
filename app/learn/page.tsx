"use client";

import { CoursePath } from "@/components/features/learn/course-path";
import { DailyGoalCard } from "@/components/features/learn/daily-goal-card";
import { DailyHero } from "@/components/features/learn/daily-hero";
import { DifficultWordsEntry } from "@/components/features/learn/difficult-words-entry";
import { LevelBadge } from "@/components/features/learn/level-badge";
import { WordsSnapshotCard } from "@/components/features/learn/words-snapshot-card";
import { PathEntryCard } from "@/components/features/path/path-entry-card";
import PracticeSettingsDialog from "@/components/features/vocabulary/practice-settings-dialog";
import { isOnboardingDone } from "@/lib/onboarding";
import { useGetMyCoursesTotalStatsQuery } from "@/queries/courses.query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LearnPage() {
    const router = useRouter();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const {
        data: courseTotalStats,
        isLoading: isLoadingCourseTotalStats,
        isError: isErrorCourseTotalStats,
    } = useGetMyCoursesTotalStatsQuery();

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

    return (
        <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
            {/* Two columns from lg: the day's work on the left, the goal rail on
                the right. On one column the goal card comes second, right under
                the hero, so it is never pushed below the course list. */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[auto_1fr] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="min-w-0 lg:col-start-1">
                    <DailyHero onOpenSettings={() => setSettingsOpen(true)} />
                </div>

                <aside
                    aria-label="Your day"
                    className="space-y-4 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
                >
                    <DailyGoalCard />
                    <LevelBadge />
                </aside>

                <div className="min-w-0 space-y-5 lg:col-start-1 lg:space-y-6">
                    <PathEntryCard />
                    {/* Only rendered when there is something tricky to work on. */}
                    <DifficultWordsEntry />
                    <CoursePath />
                    <WordsSnapshotCard />
                </div>
            </div>

            <PracticeSettingsDialog
                isOpen={settingsOpen}
                includeSessionPrefs
                onClose={() => setSettingsOpen(false)}
            />
        </main>
    );
}
