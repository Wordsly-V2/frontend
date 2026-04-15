"use client";

import LoadingSection from "@/components/common/loading-section/loading-section";
import { LearningProgressChart } from "@/components/common/learning-progress-chart";
import { StatsCards } from "@/components/common/stats-cards";
import LearningProgressSection from "@/components/common/word-progress-stats/learning-progress-section";
import { LearnQuickActions } from "@/components/features/learn/learn-quick-actions";
import CourseGrid from "@/components/features/courses/course-grid";
import CoursesHeader from "@/components/features/courses/courses-header";
import { Pagination } from "@/components/ui/pagination";
import { useGetMyCoursesQuery, useGetMyCoursesTotalStatsQuery } from "@/queries/courses.query";
import { useGetProgressStatsQuery } from "@/queries/word-progress.query";
import { useState } from "react";

export default function LearnPage() {
    const { data: courseTotalStats, isLoading: isLoadingCourseTotalStats, isError: isErrorCourseTotalStats, refetch: refetchCourseTotalStats } = useGetMyCoursesTotalStatsQuery();
    const isLoadingStats = isLoadingCourseTotalStats || isErrorCourseTotalStats || !courseTotalStats;
    const { data: wordProgressStats, isLoading: isLoadingProgressStats, isError: isErrorProgressStats, refetch: refetchProgressStats } = useGetProgressStatsQuery(undefined, undefined, true);

    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 10;

    const { data: paginatedData, isLoading: isLoadingCourses, isError: isErrorCourses, refetch: refetchCourses } = useGetMyCoursesQuery(itemsPerPage, currentPage, "name", "asc", searchQuery);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1); // Reset to first page on search
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };


    const handleClickTotalStats = () => {
        if (isErrorCourseTotalStats) {
            refetchCourseTotalStats();
        }
    }

    const handleClickProgressStats = () => {
        if (isLoadingProgressStats || isErrorProgressStats) {
            refetchProgressStats();
        }
    }

    return (
        <main className="min-h-dvh">
            <div className="container mx-auto max-w-7xl px-3 pb-10 pt-5 sm:px-4 sm:pb-12 sm:pt-6 md:py-8">
                <div className="mb-8 sm:mb-10">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Practice
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Learn</h1>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                        Courses, progress, and review — tuned for short daily study.
                    </p>
                </div>

                <LearnQuickActions />

                {/* Stats Section */}
                <StatsCards
                    items={courseTotalStats}
                    isLoading={isLoadingStats}
                    isError={isErrorCourseTotalStats}
                    onCardClick={handleClickTotalStats}
                    className="mb-6 sm:mb-8"
                />


                {/* Learning Progress (all courses) */}
                <LearningProgressSection
                    stats={wordProgressStats}
                    title="Learning Progress (All Courses)"
                    className="mb-6 sm:mb-8"
                    isLoading={isLoadingProgressStats}
                    isError={isErrorProgressStats}
                    onCardClick={handleClickProgressStats}
                />

                <LearningProgressChart
                    stats={wordProgressStats}
                    isLoading={isLoadingProgressStats}
                    isError={isErrorProgressStats}
                    className="mb-6 sm:mb-8"
                />

                <section id="course-library" className="scroll-mt-24">
                    <CoursesHeader
                        searchQuery={searchQuery}
                        totalCourses={paginatedData?.totalItems || 0}
                        onSearch={handleSearch}
                    />
                    {isLoadingCourses || isErrorCourses || !paginatedData ? (
                        <LoadingSection
                            isLoading={isLoadingCourses}
                            error={isErrorCourses ? "Error loading courses" : null}
                            refetch={refetchCourses}
                        />
                    ) : (
                        <>
                            <div className="mt-6 sm:mt-8">
                                <CourseGrid courses={paginatedData.items} />
                            </div>

                            <Pagination
                                currentPage={paginatedData.currentPage}
                                totalPages={paginatedData.totalPages}
                                onPageChange={handlePageChange}
                            />
                        </>
                    )}
                </section>

            </div>
        </main>
    );
}
