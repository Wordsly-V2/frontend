"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IReportPath } from "@/types/learning-report/learning-report.type";
import { ChartCard } from "./chart-card";

interface PathProgressCardProps {
    path: IReportPath;
}

/** Whether the learner has done anything on the Path worth reporting. */
export function hasPathActivity(path: IReportPath): boolean {
    return path.itemsStarted > 0 || path.lessonsCompleted > 0;
}

function formatAccuracy(accuracy: number | null): string {
    return accuracy == null ? "—" : `${accuracy}%`;
}

function Stat({
    label,
    value,
    hint,
}: Readonly<{ label: string; value: string; hint?: string }>) {
    return (
        <div className="rounded-xl border border-border bg-muted/20 p-3">
            <p className="text-xl font-bold tracking-tight text-foreground">
                {value}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
            {hint && (
                <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                    {hint}
                </p>
            )}
        </div>
    );
}

/**
 * Wordsly Path numbers: the items in review (all-time), this period's Path
 * reviews, and lessons, units and stages completed.
 */
export function PathProgressCard({ path }: Readonly<PathProgressCardProps>) {
    const action =
        path.dueNow > 0 ? (
            <Button asChild size="sm" variant="outline">
                <Link href="/path/review">
                    Review {path.dueNow.toLocaleString()} due
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
            </Button>
        ) : (
            <Button asChild size="sm" variant="ghost">
                <Link href="/path">
                    Open the path
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
            </Button>
        );

    return (
        <ChartCard
            title="Wordsly Path"
            subtitle={
                path.dueNow > 0
                    ? `${path.dueNow.toLocaleString()} item${path.dueNow === 1 ? "" : "s"} due for review now`
                    : "Nothing due right now"
            }
            action={action}
        >
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <Stat
                    label="Items learned"
                    value={path.itemsStarted.toLocaleString()}
                    hint={`${path.masteredItems.toLocaleString()} mastered`}
                />
                <Stat
                    label="Reviews this period"
                    value={path.periodReviews.toLocaleString()}
                    hint={`${path.periodNewItems.toLocaleString()} new item${path.periodNewItems === 1 ? "" : "s"}`}
                />
                <Stat
                    label="Accuracy this period"
                    value={formatAccuracy(path.periodAccuracy)}
                    hint={`${formatAccuracy(path.lifetimeAccuracy)} all-time`}
                />
                <Stat
                    label="Lessons completed"
                    value={path.lessonsCompleted.toLocaleString()}
                    hint={`${path.unitsCompleted.toLocaleString()} unit${path.unitsCompleted === 1 ? "" : "s"} · ${path.stagesCompleted.toLocaleString()} stage${path.stagesCompleted === 1 ? "" : "s"}`}
                />
            </div>
        </ChartCard>
    );
}
