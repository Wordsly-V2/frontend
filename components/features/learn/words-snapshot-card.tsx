"use client";

import LearningProgressSection from "@/components/common/word-progress-stats/learning-progress-section";
import { Button } from "@/components/ui/button";
import { useGetMyCoursesTotalStatsQuery } from "@/queries/courses.query";
import { useGetProgressStatsQuery } from "@/queries/word-progress.query";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * Where all of the learner's words stand, with the library size. The detailed
 * charts live on /progress, which this links to.
 */
export function WordsSnapshotCard({ className }: Readonly<{ className?: string }>) {
    const { data: stats } = useGetProgressStatsQuery(undefined, undefined, true);
    const { data: library } = useGetMyCoursesTotalStatsQuery();

    // Gate on data, not fetch outcome: offline a restored cache reports an
    // error next to usable data.
    if (stats && stats.totalWords === 0) return null;

    return (
        <LearningProgressSection
            className={className}
            title="Your words"
            stats={stats}
            isLoading={!stats}
            subtitle={
                library &&
                `${library.totalWords} words in ${library.totalCourses} course${library.totalCourses === 1 ? "" : "s"} · ${library.totalLessons} lesson${library.totalLessons === 1 ? "" : "s"}`
            }
            action={
                <Button variant="ghost" size="sm" asChild className="-mr-2 gap-1 text-primary">
                    <Link href="/progress">
                        Progress
                        <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                </Button>
            }
        />
    );
}
