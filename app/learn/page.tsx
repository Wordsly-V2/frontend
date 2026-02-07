"use client";

import LoadingSection from "@/components/common/loading-section/loading-section";
import LearningProgressSection from "@/components/common/word-progress-stats/learning-progress-section";
import CourseGrid from "@/components/features/courses/course-grid";
import CoursesHeader from "@/components/features/courses/courses-header";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                    <div className="bg-card border border-border rounded-lg p-4 sm:p-5 md:p-6 hover:border-primary/50 transition-all cursor-pointer card-hover" onClick={handleClickTotalStats}>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0">
                                <svg
                                    className="h-5 w-5 sm:h-6 sm:w-6 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                    />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                {
                                    isLoadingStats ? (
                                        <LoadingSpinner size="sm" />
                                    ) : isErrorCourseTotalStats ? (
                                        <p className="text-xl sm:text-2xl font-bold">--</p>
                                    ) : (
                                        <p className="text-xl sm:text-2xl font-bold">{courseTotalStats?.totalCourses || 0}</p>
                                    )
                                }
                                <p className="text-xs sm:text-sm text-muted-foreground">Courses</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-4 sm:p-5 md:p-6 hover:border-primary/50 transition-all cursor-pointer card-hover" onClick={handleClickTotalStats}>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
                                <svg
                                    className="h-5 w-5 sm:h-6 sm:w-6 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                {
                                    isLoadingStats ? (
                                        <LoadingSpinner size="sm" />
                                    ) : isErrorCourseTotalStats ? (
                                        <p className="text-xl sm:text-2xl font-bold">--</p>
                                    ) : (
                                        <p className="text-xl sm:text-2xl font-bold">{courseTotalStats?.totalLessons || 0}</p>
                                    )
                                }
                                <p className="text-xs sm:text-sm text-muted-foreground">Lessons</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-4 sm:p-5 md:p-6 hover:border-primary/50 transition-all cursor-pointer card-hover" onClick={handleClickTotalStats}>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                                <svg
                                    className="h-5 w-5 sm:h-6 sm:w-6 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                    />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                {
                                    isLoadingStats ? (
                                        <LoadingSpinner size="sm" />
                                    ) : isErrorCourseTotalStats ? (
                                        <p className="text-xl sm:text-2xl font-bold">--</p>
                                    ) : (
                                        <p className="text-xl sm:text-2xl font-bold">{courseTotalStats?.totalWords || 0}</p>
                                    )
                                }
                                <p className="text-xs sm:text-sm text-muted-foreground">Words</p>
                            </div>
                        </div>
                    </div>
                </div>


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
