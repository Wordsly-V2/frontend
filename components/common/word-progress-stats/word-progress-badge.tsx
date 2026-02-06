"use client";

import { IWordProgress } from "@/types/courses/courses.type";

interface WordProgressBadgeProps {
    progress: IWordProgress;
    className?: string;
}

function formatNextReview(nextReviewAt: Date | string): string {
    const date = typeof nextReviewAt === "string" ? new Date(nextReviewAt) : nextReviewAt;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const reviewDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.ceil((reviewDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays}d`;
    if (diffDays < -1 && diffDays >= -7) return "Overdue";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function WordProgressBadge({
    progress,
    className = "",
}: Readonly<WordProgressBadgeProps>) {
    const successRate = Math.round(progress.successRate);
    const nextReviewLabel = formatNextReview(progress.nextReviewAt);
    const fullNextReview =
        typeof progress.nextReviewAt === "string"
            ? new Date(progress.nextReviewAt).toLocaleString()
            : progress.nextReviewAt.toLocaleString();
    const title = `Success: ${successRate}% · Reviews: ${progress.correctReviews}/${progress.totalReviews} · Next: ${fullNextReview} · Interval: ${progress.interval}d`;

    return (
        <div
            title={title}
            className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-[10px] sm:text-xs ${className}`}
        >
            <span className="font-medium text-teal-600 dark:text-teal-400">
                {successRate}%
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{progress.repetitions}×</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{nextReviewLabel}</span>
        </div>
    );
}
