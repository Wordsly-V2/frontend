"use client";

import { QueryBoundary, SkeletonGrid } from "@/components/common/states";
import { EmptyState } from "@/components/common/states";
import CourseGrid from "@/components/features/courses/course-grid";
import CoursesHeader from "@/components/features/courses/courses-header";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {
    useClampPage,
    useCoursesListParams,
} from "@/hooks/useCoursesListParams.hook";
import { useGetMyCoursesQuery } from "@/queries/courses.query";
import { Library, SearchX } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";

const ITEMS_PER_PAGE = 10;

export default function CoursesLibraryPage() {
    const scrollListIntoView = useCallback(() => {
        document
            .getElementById("course-library")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    const {
        searchQuery,
        searchInput,
        setSearchInput,
        page,
        setPage,
        clampPage,
    } = useCoursesListParams({ onPageChange: scrollListIntoView });

    const {
        data: paginatedData,
        isLoading,
        isError,
        isFetching,
        refetch,
    } = useGetMyCoursesQuery({
        itemsPerPage: ITEMS_PER_PAGE,
        currentPage: page,
        orderByField: "name",
        orderByDirection: "asc",
        searchQuery,
    });

    useClampPage(clampPage, paginatedData?.totalPages);

    const hasResults = !!paginatedData && paginatedData.items.length > 0;
    const isEmpty = !!paginatedData && paginatedData.items.length === 0;

    return (
        <main className="min-h-dvh">
            <div className="container mx-auto max-w-7xl px-3 pb-24 pt-5 sm:px-4 sm:pb-12 sm:pt-6 md:py-8">
                <div className="mb-6 sm:mb-8">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Your library
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        Courses
                    </h1>
                </div>

                <section id="course-library" className="scroll-mt-24">
                    <CoursesHeader
                        searchQuery={searchInput}
                        totalCourses={paginatedData?.totalItems || 0}
                        onSearch={setSearchInput}
                    />

                    <QueryBoundary
                        // Offline, a restored cache reports `isError` alongside
                        // usable data — gate on the data, never the fetch outcome.
                        isLoading={isLoading && !paginatedData}
                        isError={isError && !paginatedData}
                        isEmpty={isEmpty}
                        errorMessage="We couldn't load your courses."
                        onRetry={refetch}
                        skeleton={<SkeletonGrid className="mt-6 sm:mt-8" count={6} />}
                        empty={
                            searchQuery ? (
                                <EmptyState
                                    className="mt-8"
                                    icon={SearchX}
                                    title="No courses match your search"
                                    description={`Nothing found for “${searchQuery}”. Try a different name.`}
                                    action={
                                        <Button
                                            variant="playOutline"
                                            onClick={() => setSearchInput("")}
                                        >
                                            Clear search
                                        </Button>
                                    }
                                />
                            ) : (
                                <EmptyState
                                    className="mt-8"
                                    icon={Library}
                                    title="No courses yet"
                                    description="Add a course in Manage to start building your streak."
                                    action={
                                        <Button variant="play" asChild>
                                            <Link href="/manage">Go to Manage</Link>
                                        </Button>
                                    }
                                />
                            )
                        }
                    >
                        {hasResults && (
                            <>
                                <div
                                    className={`mt-6 transition-opacity sm:mt-8 ${
                                        isFetching ? "opacity-60" : ""
                                    }`}
                                >
                                    <CourseGrid courses={paginatedData.items} />
                                </div>
                                <Pagination
                                    // The URL is the source of truth, not the last
                                    // server echo — otherwise the highlighted page
                                    // lags a request behind the address bar.
                                    currentPage={page}
                                    totalPages={paginatedData.totalPages}
                                    onPageChange={setPage}
                                    label="Courses pagination"
                                />
                            </>
                        )}
                    </QueryBoundary>
                </section>
            </div>
        </main>
    );
}
