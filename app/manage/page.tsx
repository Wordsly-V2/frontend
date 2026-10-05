"use client";

import { PageHeader, PageShell } from "@/components/common/page";
import { Button } from "@/components/ui/button";
import { useGetMyCoursesTotalStatsQuery } from "@/queries/courses.query";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef } from "react";
import ManageCourses from "./manage-courses";

export default function ManagePage() {
    const createCourseRef = useRef<(() => void) | null>(null);
    const registerCreateCourse = useCallback((fn: () => void) => {
        createCourseRef.current = fn;
    }, []);
    const { data: totals } = useGetMyCoursesTotalStatsQuery();

    return (
        <PageShell>
            <PageHeader
                eyebrow="Studio"
                title="Manage"
                description={
                    <>
                        Build courses, lessons and words, then study them in Learn.
                        {totals && (
                            <span className="mt-1 block text-xs font-semibold text-muted-foreground/90">
                                {totals.totalCourses} course{totals.totalCourses === 1 ? "" : "s"} ·{" "}
                                {totals.totalLessons} lesson{totals.totalLessons === 1 ? "" : "s"} ·{" "}
                                {totals.totalWords} word{totals.totalWords === 1 ? "" : "s"}
                            </span>
                        )}
                    </>
                }
                actions={
                    <>
                        <Button variant="playOutline" asChild className="h-10 gap-2">
                            <Link href="/learn">
                                <BookOpen className="h-4 w-4" aria-hidden />
                                Open Learn
                            </Link>
                        </Button>
                        <Button variant="play" className="h-10 gap-2" onClick={() => createCourseRef.current?.()}>
                            <Plus className="h-4 w-4" aria-hidden />
                            New course
                        </Button>
                    </>
                }
            />

            <ManageCourses onRegisterCreateCourse={registerCreateCourse} />
        </PageShell>
    );
}
