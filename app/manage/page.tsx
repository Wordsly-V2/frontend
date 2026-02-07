"use client";

import { StatsCards, getCourseTotalStatsItems } from "@/components/common/stats-cards";
import { LearningProgressSection } from "@/components/common/word-progress-stats";
import { useGetMyCoursesTotalStatsQuery } from "@/queries/courses.query";
import { useGetProgressStatsQuery } from "@/queries/word-progress.query";
import { toast } from "sonner";
import { useEffect } from "react";
import ManageCourses from "./manage-courses";

export default function ManagePage() {
    const { data: courseTotalStats, isLoading, isError, refetch: refetchCourseTotalStats, error } = useGetMyCoursesTotalStatsQuery();
    const { data: wordProgressStats } = useGetProgressStatsQuery(undefined, undefined, true);

    useEffect(() => {
        if (isError) {
            toast.error('Failed to load course total stats: ' + error?.message);
        }
    }, [isError, error]);

    const handleClickTotalStats = () => {
        if (isLoading || isError) {
            refetchCourseTotalStats();
        }
    }

    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 sm:mb-2">Management Dashboard</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Create, edit, and organize your learning content
                    </p>
                </div>

                {/* Stats Cards */}
                <StatsCards
                    items={getCourseTotalStatsItems(courseTotalStats)}
                    isLoading={isLoading}
                    isError={isError}
                    onCardClick={handleClickTotalStats}
                    className="mb-6 sm:mb-8"
                />

                {/* Learning Progress (all courses) */}
                {wordProgressStats && (
                    <LearningProgressSection
                        stats={wordProgressStats}
                        title="Learning Progress (All Courses)"
                        className="mb-6 sm:mb-8"
                    />
                )}

                <ManageCourses />
            </div>
        </main>
    );
}
