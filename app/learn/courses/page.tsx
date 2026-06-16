"use client";

import { QueryBoundary, SkeletonGrid } from "@/components/common/states";
import { EmptyState } from "@/components/common/states";
import CourseGrid from "@/components/features/courses/course-grid";
import CoursesHeader from "@/components/features/courses/courses-header";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { coursesListSearchParams } from "@/lib/search-params/courses-list";
import { useGetMyCoursesQuery } from "@/queries/courses.query";
import { Library } from "lucide-react";
import Link from "next/link";
import { useQueryStates } from "nuqs";

export default function CoursesLibraryPage() {
    const [{ q: searchQuery, page: currentPage }, setSearchParams] =
        useQueryStates(coursesListSearchParams, { history: "replace" });
    const itemsPerPage = 10;

    const {
        data: paginatedData,
        isLoading,
        isError,
        refetch,
    } = useGetMyCoursesQuery(
        itemsPerPage,
        currentPage,
        "name",
        "asc",
        searchQuery,
    );

    const isEmpty =
        !!paginatedData && paginatedData.items.length === 0 && !searchQuery;

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

                <CoursesHeader
                    searchQuery={searchQuery}
                    totalCourses={paginatedData?.totalItems || 0}
                    onSearch={(q) => setSearchParams({ q: q || null, page: 1 })}
                />

                <QueryBoundary
                    isLoading={isLoading}
                    isError={isError}
                    isEmpty={isEmpty}
                    errorMessage="We couldn't load your courses."
                    onRetry={refetch}
                    skeleton={<SkeletonGrid className="mt-6 sm:mt-8" count={6} />}
                    empty={
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
                    }
                >
                    {paginatedData && (
                        <>
                            <div className="mt-6 sm:mt-8">
                                <CourseGrid courses={paginatedData.items} />
                            </div>
                            <Pagination
                                currentPage={paginatedData.currentPage}
                                totalPages={paginatedData.totalPages}
                                onPageChange={(page) => setSearchParams({ page })}
                            />
                        </>
                    )}
                </QueryBoundary>
            </div>
        </main>
    );
}
