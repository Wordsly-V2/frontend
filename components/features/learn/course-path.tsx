"use client";

import { Bounce } from "@/components/common/motion";
import { SkeletonCard } from "@/components/common/states";
import CourseCard from "@/components/features/courses/course-card";
import { Button } from "@/components/ui/button";
import { getLastLearnCourse } from "@/lib/learning-session";
import { useGetMyCoursesQuery } from "@/queries/courses.query";
import { useGetProgressStatsByCourseIdsQuery } from "@/queries/word-progress.query";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";

/** "Jump back in" — last-opened course first, then a few more. */
export function CoursePath() {
    const [lastId, setLastId] = useState<string | null>(null);
    const { data, isLoading } = useGetMyCoursesQuery({ itemsPerPage: 6, currentPage: 1 });

    useEffect(() => {
        startTransition(() => setLastId(getLastLearnCourse()?.id ?? null));
    }, []);

    // Pinned courses lead (the server already returns them first), then the
    // last-opened one, then whatever else fits in the row.
    const courses = useMemo(() => {
        const items = data?.items ?? [];
        const rank = (course: (typeof items)[number]) => {
            if (course.isPinned) return 0;
            if (course.id === lastId) return 1;
            return 2;
        };
        const sorted = [...items]
            .map((course, index) => ({ course, index }))
            .sort(
                (a, b) =>
                    rank(a.course) - rank(b.course) || a.index - b.index,
            )
            .map(({ course }) => course);
        return sorted.slice(0, 3);
    }, [data?.items, lastId]);

    const courseIds = courses.map((course) => course.id);
    const { data: statsByCourseId } = useGetProgressStatsByCourseIdsQuery(
        courseIds,
        courses.length > 0,
    );

    if (!isLoading && courses.length === 0) return null;

    return (
        <section aria-label="Continue learning" className="mb-8">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold sm:text-xl">
                    <span className="text-gradient-brand">Jump back in</span>
                </h2>
                <Button variant="ghost" size="sm" asChild className="gap-1">
                    <Link href="/learn/courses">
                        All courses
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                          <SkeletonCard key={i} />
                      ))
                    : courses.map((course) => (
                          <Bounce key={course.id}>
                              <CourseCard
                                  course={course}
                                  wordProgressStats={statsByCourseId?.[course.id]}
                              />
                          </Bounce>
                      ))}
            </div>
        </section>
    );
}
