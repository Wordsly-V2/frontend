"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Skeleton } from "@/components/common/states/skeleton";
import { useUser } from "@/hooks/useUser.hook";
import { useGetLearningReportQuery } from "@/queries/learning-report.query";
import type { ReportPeriod } from "@/types/learning-report/learning-report.type";
import { AchievementsGrid } from "@/components/features/progress/achievements-grid";
import { ActivityHeatmap } from "@/components/features/progress/activity-heatmap";
import { ReportPeriodToggle } from "@/components/features/progress/report-period-toggle";
import { ReportSummaryCards } from "@/components/features/progress/report-summary-cards";

/** Placeholder matching ChartCard's shell while a chart chunk loads. */
function ChartSkeleton() {
    return (
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <Skeleton className="mb-1 h-4 w-32" />
            <Skeleton className="mb-4 h-3 w-48" />
            <Skeleton className="h-[240px] w-full rounded-xl" />
        </div>
    );
}

// Recharts-based charts are loaded on demand so the heavy charting library
// stays out of the initial bundle (ssr: false — they render client-side only).
const WordsOverTimeChart = dynamic(
    () =>
        import("@/components/features/progress/words-over-time-chart").then(
            (m) => m.WordsOverTimeChart,
        ),
    { ssr: false, loading: () => <ChartSkeleton /> },
);
const AccuracyTrendChart = dynamic(
    () =>
        import("@/components/features/progress/accuracy-trend-chart").then(
            (m) => m.AccuracyTrendChart,
        ),
    { ssr: false, loading: () => <ChartSkeleton /> },
);
const ConsistencyChart = dynamic(
    () =>
        import("@/components/features/progress/consistency-chart").then(
            (m) => m.ConsistencyChart,
        ),
    { ssr: false, loading: () => <ChartSkeleton /> },
);
const MasteryBreakdownChart = dynamic(
    () =>
        import("@/components/features/progress/mastery-breakdown-chart").then(
            (m) => m.MasteryBreakdownChart,
        ),
    { ssr: false, loading: () => <ChartSkeleton /> },
);
const UpcomingReviewsChart = dynamic(
    () =>
        import("@/components/features/progress/upcoming-reviews-chart").then(
            (m) => m.UpcomingReviewsChart,
        ),
    { ssr: false, loading: () => <ChartSkeleton /> },
);

export default function ProgressPage() {
    const router = useRouter();
    const { profile, isLoading: isUserLoading } = useUser();
    const [period, setPeriod] = useState<ReportPeriod>("week");
    const {
        data: report,
        isLoading,
        isError,
        refetch,
    } = useGetLearningReportQuery(period, !!profile);

    if (isUserLoading) {
        return (
            <main className="flex min-h-dvh items-center justify-center px-4">
                <LoadingSpinner size="lg" label="Loading…" />
            </main>
        );
    }

    if (!profile) {
        return (
            <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
                <p className="text-muted-foreground">
                    Log in to see your learning progress report.
                </p>
                <Button onClick={() => router.push("/auth/login")}>Log in</Button>
            </main>
        );
    }

    const hasAccuracy = !!report?.buckets.some((b) => b.reviews > 0);

    return (
        <div className="min-h-dvh px-4 pb-24 pt-8 md:px-8 md:pb-12 md:pt-12">
            <div className="mx-auto max-w-5xl space-y-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Progress
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Your learning report
                        </h1>
                        <p className="text-muted-foreground">
                            See how much you&apos;ve learned and improved over time.
                        </p>
                    </div>
                    <ReportPeriodToggle value={period} onChange={setPeriod} />
                </header>

                {isLoading && (
                    <div className="flex min-h-[50vh] items-center justify-center">
                        <LoadingSpinner size="lg" label="Building your report…" />
                    </div>
                )}

                {isError && (
                    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-muted/20 px-4 text-center">
                        <p className="text-muted-foreground">
                            Couldn&apos;t load your report.
                        </p>
                        <Button variant="outline" onClick={() => refetch()}>
                            Try again
                        </Button>
                    </div>
                )}

                {report && !isLoading && !isError && (
                    <div className="space-y-4">
                        <ReportSummaryCards
                            summary={report.summary}
                            hasAccuracy={hasAccuracy}
                        />
                        <div className="grid gap-4 lg:grid-cols-2">
                            <WordsOverTimeChart
                                buckets={report.buckets}
                                granularity={report.granularity}
                                total={report.summary.wordsLearned}
                            />
                            <AccuracyTrendChart
                                buckets={report.buckets}
                                granularity={report.granularity}
                                avgAccuracy={report.summary.avgAccuracy}
                            />
                            <ConsistencyChart
                                buckets={report.buckets}
                                granularity={report.granularity}
                                streaks={report.streaks}
                                activeDays={report.summary.activeDays}
                                goalMetDays={report.summary.goalMetDays}
                            />
                            <MasteryBreakdownChart mastery={report.mastery} />
                            <UpcomingReviewsChart />
                        </div>
                        <ActivityHeatmap />
                        <AchievementsGrid achievements={report.achievements} />
                    </div>
                )}
            </div>
        </div>
    );
}
