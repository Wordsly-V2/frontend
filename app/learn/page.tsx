"use client";

import LoadingSection from "@/components/common/loading-section/loading-section";
import { StatsCards, getCourseTotalStatsItems } from "@/components/common/stats-cards";
import LearningProgressSection from "@/components/common/word-progress-stats/learning-progress-section";
import CourseGrid from "@/components/features/courses/course-grid";
import CoursesHeader from "@/components/features/courses/courses-header";
import { Pagination } from "@/components/ui/pagination";
import { useGetMyCoursesQuery, useGetMyCoursesTotalStatsQuery } from "@/queries/courses.query";
import { useGetProgressStatsQuery } from "@/queries/word-progress.query";
import { useState } from "react";

export default function LearnPage() {
    const { data: courseTotalStats, isLoading: isLoadingCourseTotalStats, isError: isErrorCourseTotalStats, refetch: refetchCourseTotalStats } = useGetMyCoursesTotalStatsQuery();
    const isLoadingStats = isLoadingCourseTotalStats || isErrorCourseTotalStats || !courseTotalStats;
    const { data: wordProgressStats } = useGetProgressStatsQuery(undefined, undefined, true);

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

    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 sm:mb-2">Learn</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Learn new words and improve your vocabulary
                    </p>
                </div>

                {/* Stats Section */}
                <StatsCards
                    items={getCourseTotalStatsItems(courseTotalStats)}
                    isLoading={isLoadingStats}
                    isError={isErrorCourseTotalStats}
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
                
                <CoursesHeader
                    searchQuery={searchQuery}
                    totalCourses={paginatedData?.totalItems || 0}
                    onSearch={handleSearch}
                />
                {
                    isLoadingCourses || isErrorCourses || !paginatedData ? (
                        <LoadingSection isLoading={isLoadingCourses} error={isErrorCourses ? 'Error loading courses' : null} refetch={refetchCourses} />
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
                    )
                }

            </div>
        </main>
    );
}
