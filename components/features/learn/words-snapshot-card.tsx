"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGetMyCoursesTotalStatsQuery } from "@/queries/courses.query";
import { useGetProgressStatsQuery } from "@/queries/word-progress.query";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const SEGMENTS = [
    { key: "newWords", label: "New", className: "bg-[var(--brand-secondary)]" },
    { key: "learningWords", label: "Learning", className: "bg-[var(--brand-warning)]" },
    { key: "reviewWords", label: "Review", className: "bg-[var(--brand-success)]" },
] as const;

/**
 * Where all of the learner's words stand, in one bar, with the library size and
 * success rate. The detailed charts live on /progress, which this links to.
 */
export function WordsSnapshotCard({ className }: Readonly<{ className?: string }>) {
    const { data: stats } = useGetProgressStatsQuery(undefined, undefined, true);
    const { data: library } = useGetMyCoursesTotalStatsQuery();

    // Gate on data, not fetch outcome: offline a restored cache reports an
    // error next to usable data.
    if (!stats) {
        return <div className={cn("h-44 animate-pulse rounded-3xl border border-border/70 bg-card", className)} />;
    }
    if (stats.totalWords === 0) return null;

    const total = stats.totalWords;

    return (
        <section aria-label="Your words" className={cn("rounded-3xl border border-border/70 bg-card p-5 shadow-sm", className)}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="font-display text-lg font-bold">Your words</h2>
                    {library && (
                        <p className="text-xs text-muted-foreground">
                            {library.totalWords} words in {library.totalCourses} course{library.totalCourses === 1 ? "" : "s"} ·{" "}
                            {library.totalLessons} lesson{library.totalLessons === 1 ? "" : "s"}
                        </p>
                    )}
                </div>
                <Button variant="ghost" size="sm" asChild className="-mr-2 gap-1 text-primary">
                    <Link href="/progress">
                        Progress
                        <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                </Button>
            </div>

            <div
                className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted"
                role="img"
                aria-label={SEGMENTS.map((s) => `${stats[s.key]} ${s.label.toLowerCase()}`).join(", ")}
            >
                {SEGMENTS.map((s) =>
                    stats[s.key] > 0 ? (
                        <div key={s.key} className={cn("h-full first:rounded-l-full last:rounded-r-full", s.className)} style={{ width: `${(stats[s.key] / total) * 100}%` }} />
                    ) : null,
                )}
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-5">
                {SEGMENTS.map((s) => (
                    <div key={s.key}>
                        <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <span aria-hidden className={cn("h-2.5 w-2.5 rounded-full", s.className)} />
                            {s.label}
                        </dt>
                        <dd className="font-display text-xl font-bold tabular-nums">{stats[s.key]}</dd>
                    </div>
                ))}
                <div>
                    <dt className="text-xs font-semibold text-muted-foreground">Due today</dt>
                    <dd className="font-display text-xl font-bold tabular-nums">{stats.dueToday}</dd>
                </div>
                <div>
                    <dt className="text-xs font-semibold text-muted-foreground">Success</dt>
                    <dd className="font-display text-xl font-bold tabular-nums">{Math.round(stats.overallSuccessRate)}%</dd>
                </div>
            </dl>
        </section>
    );
}
