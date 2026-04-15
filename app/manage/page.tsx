"use client";

import { StatsCards } from "@/components/common/stats-cards";
import { LearningProgressSection } from "@/components/common/word-progress-stats";
import { Button } from "@/components/ui/button";
import { useGetMyCoursesTotalStatsQuery } from "@/queries/courses.query";
import { useGetProgressStatsQuery } from "@/queries/word-progress.query";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";
import ManageCourses from "./manage-courses";

export default function ManagePage() {
    const { data: courseTotalStats, isLoading, isError, refetch: refetchCourseTotalStats, error } = useGetMyCoursesTotalStatsQuery();
    const {
        data: wordProgressStats,
        isLoading: isProgressStatsLoading,
        isError: isProgressStatsError,
        refetch: refetchProgressStats,
        error: progressStatsError,
    } = useGetProgressStatsQuery(undefined, undefined, true);

    useEffect(() => {
        if (isError) {
            toast.error("Failed to load course total stats: " + (error?.message ?? "Unknown error"));
        }
    }, [isError, error]);

    useEffect(() => {
        if (isProgressStatsError) {
            toast.error("Failed to load learning progress: " + (progressStatsError?.message ?? "Unknown error"));
        }
    }, [isProgressStatsError, progressStatsError]);

    const handleClickTotalStats = () => {
        if (isLoading || isError) {
            refetchCourseTotalStats();
        }
    };

    const handleClickProgressStats = () => {
        if (isProgressStatsLoading || isProgressStatsError) {
            refetchProgressStats();
        }
    };

    return (
        <main className="min-h-dvh">
            <div className="container mx-auto max-w-7xl px-3 pb-10 pt-5 sm:px-4 sm:pb-12 sm:pt-6 md:py-8">
                <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Studio
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Manage</h1>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                            Build content here — study it in Learn.
                        </p>
                    </div>
                    <Button variant="outline" className="h-10 w-full shrink-0 rounded-xl sm:w-auto" asChild>
                        <Link href="/learn">
                            <BookOpen className="h-4 w-4" />
                            Open Learn
                        </Link>
                    </Button>
                </div>

                {/* Stats Cards */}
                <StatsCards
                    items={courseTotalStats}
                    isLoading={isLoading}
                    isError={isError}
                    onCardClick={handleClickTotalStats}
                    className="mb-6 sm:mb-8"
                />

                {/* Learning Progress (all courses) */}
                <LearningProgressSection
                    stats={wordProgressStats}
                    title="Learning Progress (All Courses)"
                    className="mb-6 sm:mb-8"
                    isLoading={isProgressStatsLoading}
                    isError={isProgressStatsError}
                    onCardClick={handleClickProgressStats}
                />

                <ManageCourses />
            </div>
        </main>
    );
}
