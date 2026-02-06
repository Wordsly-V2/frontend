"use client";

import { Brain } from "lucide-react";
import { IWordProgressStats } from "@/types/courses/courses.type";

interface LearningProgressSectionProps {
    stats: IWordProgressStats;
    title?: string;
    className?: string;
}

export default function LearningProgressSection({
    stats,
    title = "Learning Progress",
    className = "",
}: Readonly<LearningProgressSectionProps>) {
    const startedCount = stats.learningWords + stats.reviewWords;
    const progressPercent =
        stats.totalWords > 0 ? (startedCount / stats.totalWords) * 100 : 0;

    return (
        <div
            className={`bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6 ${className}`}
        >
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 dark:border-blue-800">
                    <div className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                        Total Words
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">
                        {stats.totalWords}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200 dark:border-green-800">
                    <div className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                        New
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">
                        {stats.newWords}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-orange-200 dark:border-orange-800">
                    <div className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
                        Learning
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-orange-900 dark:text-orange-100">
                        {stats.learningWords}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-200 dark:border-purple-800">
                    <div className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                        Review
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-100">
                        {stats.reviewWords}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-200 dark:border-red-800">
                    <div className="text-xs sm:text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                        Due Today
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-red-900 dark:text-red-100">
                        {stats.dueToday}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/30 dark:to-teal-900/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-teal-200 dark:border-teal-800">
                    <div className="text-xs sm:text-sm font-medium text-teal-700 dark:text-teal-300 mb-1">
                        Success Rate
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-teal-900 dark:text-teal-100">
                        {Math.round(stats.overallSuccessRate)}%
                    </div>
                </div>
            </div>

            {stats.totalWords > 0 && (
                <div className="mt-4 sm:mt-6">
                    <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-2">
                        <span>Learning Progress</span>
                        <span>
                            {startedCount} / {stats.totalWords} words started
                        </span>
                    </div>
                    <div className="h-2 sm:h-3 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
