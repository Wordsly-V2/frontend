"use client";

import { StatsCards } from "@/components/common/stats-cards";
import { ManageQuickActions } from "@/components/features/manage/manage-quick-actions";
import { useGetMyCoursesTotalStatsQuery } from "@/queries/courses.query";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import ManageCourses from "./manage-courses";

export default function ManagePage() {
    const createCourseRef = useRef<(() => void) | null>(null);
    const registerCreateCourse = useCallback((fn: () => void) => {
        createCourseRef.current = fn;
    }, []);
    const { data: courseTotalStats, isLoading, isError, refetch: refetchCourseTotalStats, error } =
        useGetMyCoursesTotalStatsQuery();

    useEffect(() => {
        if (isError) {
            toast.error("Failed to load content stats: " + (error?.message ?? "Unknown error"));
        }
    }, [isError, error]);

    const handleClickTotalStats = () => {
        if (isLoading || isError) {
            refetchCourseTotalStats();
        }
    };

    return (
        <main className="min-h-dvh">
            <div className="container mx-auto max-w-7xl px-3 pb-24 pt-5 sm:px-4 sm:pb-12 sm:pt-6 md:py-8">
                <div className="mb-8 sm:mb-10">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Studio
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Manage</h1>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                        Build courses, lessons, and vocabulary — then study them in Learn.
                    </p>
                </div>

                <ManageQuickActions
                    onCreateCourse={() => createCourseRef.current?.()}
                />

                <StatsCards
                    items={courseTotalStats}
                    isLoading={isLoading}
                    isError={isError}
                    onCardClick={handleClickTotalStats}
                    className="mb-6 sm:mb-8"
                />

                <ManageCourses onRegisterCreateCourse={registerCreateCourse} />
            </div>
        </main>
    );
}
