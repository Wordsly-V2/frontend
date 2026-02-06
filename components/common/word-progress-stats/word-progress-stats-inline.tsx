"use client";

import { IWordProgressStats } from "@/types/courses/courses.type";

interface WordProgressStatsInlineProps {
    stats: IWordProgressStats;
    /** If provided and 0, hide when totalWords is 0 (e.g. lesson has no words) */
    totalWords?: number;
    className?: string;
}

export default function WordProgressStatsInline({
    stats,
    totalWords,
    className = "",
}: Readonly<WordProgressStatsInlineProps>) {
    if (totalWords !== undefined && totalWords === 0) return null;

    const hasStarted = stats.learningWords + stats.reviewWords > 0;

    return (
        <div
            className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}
        >
            <span className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium">
                {stats.newWords} new
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-[10px] sm:text-xs text-orange-600 dark:text-orange-400 font-medium">
                {stats.learningWords} learning
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400 font-medium">
                {stats.reviewWords} review
            </span>
            {stats.dueToday > 0 && (
                <>
                    <span className="text-muted-foreground/60">·</span>
                    <span className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-medium">
                        {stats.dueToday} due
                    </span>
                </>
            )}
            {hasStarted && (
                <>
                    <span className="text-muted-foreground/60">·</span>
                    <span className="text-[10px] sm:text-xs text-teal-600 dark:text-teal-400 font-medium">
                        {Math.round(stats.overallSuccessRate)}%
                    </span>
                </>
            )}
        </div>
    );
}
