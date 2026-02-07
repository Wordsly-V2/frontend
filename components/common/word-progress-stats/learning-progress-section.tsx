"use client";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { IWordProgressStats } from "@/types/courses/courses.type";
import { Brain } from "lucide-react";

const DEFAULT_STATS: IWordProgressStats = {
    totalWords: 0,
    newWords: 0,
    learningWords: 0,
    reviewWords: 0,
    dueToday: 0,
    overallSuccessRate: 0,
};

export interface LearningProgressSectionProps {
    stats?: IWordProgressStats | null;
    title?: string;
    className?: string;
    /** When true, each card shows a loading spinner. */
    isLoading?: boolean;
    /** When true, each card shows "--". */
    isError?: boolean;
    /** Called when section is clicked (e.g. to refetch). Optional. */
    onCardClick?: () => void;
}

function StatValue({
    isLoading,
    isError,
    value,
    suffix = "",
}: Readonly<{
    isLoading: boolean;
    isError: boolean;
    value: number | string;
    suffix?: string;
}>) {
    if (isLoading) {
        return <LoadingSpinner size="sm" />;
    }
    if (isError) {
        return <span className="text-2xl sm:text-3xl font-bold">--</span>;
    }
    return (
        <span className="text-2xl sm:text-3xl font-bold">
            {value}
            {suffix}
        </span>
    );
}

export default function LearningProgressSection({
    stats,
    title = "Learning Progress",
    className = "",
    isLoading = false,
    isError = false,
    onCardClick,
}: Readonly<LearningProgressSectionProps>) {
    const sectionClassName = `bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6 ${className}`.trim();
    const isClickable = Boolean(onCardClick);
    const displayStats = stats ?? DEFAULT_STATS;
    const startedCount = displayStats.learningWords + displayStats.reviewWords;
    const progressPercent =
        displayStats.totalWords > 0 ? (startedCount / displayStats.totalWords) * 100 : 0;

    const cardHoverClass = isClickable
        ? "cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg sm:rounded-xl"
        : "";

    const CardWrapper = isClickable ? "button" : "div";
    const cardWrapperProps = isClickable
        ? { type: "button" as const, onClick: onCardClick }
        : {};

    return (
        <div className={sectionClassName}>
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <CardWrapper
                    className={`w-full text-left bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 dark:border-blue-800 ${cardHoverClass}`}
                    {...cardWrapperProps}
                >
                    <div className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                        Total Words
                    </div>
                    <div className="text-blue-900 dark:text-blue-100">
                        <StatValue isLoading={isLoading} isError={isError} value={displayStats.totalWords} />
                    </div>
                </CardWrapper>

                <CardWrapper
                    className={`w-full text-left bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200 dark:border-green-800 ${cardHoverClass}`}
                    {...cardWrapperProps}
                >
                    <div className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                        New
                    </div>
                    <div className="text-green-900 dark:text-green-100">
                        <StatValue isLoading={isLoading} isError={isError} value={displayStats.newWords} />
                    </div>
                </CardWrapper>

                <CardWrapper
                    className={`w-full text-left bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-orange-200 dark:border-orange-800 ${cardHoverClass}`}
                    {...cardWrapperProps}
                >
                    <div className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
                        Learning
                    </div>
                    <div className="text-orange-900 dark:text-orange-100">
                        <StatValue isLoading={isLoading} isError={isError} value={displayStats.learningWords} />
                    </div>
                </CardWrapper>

                <CardWrapper
                    className={`w-full text-left bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-200 dark:border-purple-800 ${cardHoverClass}`}
                    {...cardWrapperProps}
                >
                    <div className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                        Review
                    </div>
                    <div className="text-purple-900 dark:text-purple-100">
                        <StatValue isLoading={isLoading} isError={isError} value={displayStats.reviewWords} />
                    </div>
                </CardWrapper>

                <CardWrapper
                    className={`w-full text-left bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-200 dark:border-red-800 ${cardHoverClass}`}
                    {...cardWrapperProps}
                >
                    <div className="text-xs sm:text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                        Due Today
                    </div>
                    <div className="text-red-900 dark:text-red-100">
                        <StatValue isLoading={isLoading} isError={isError} value={displayStats.dueToday} />
                    </div>
                </CardWrapper>

                <CardWrapper
                    className={`w-full text-left bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/30 dark:to-teal-900/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-teal-200 dark:border-teal-800 ${cardHoverClass}`}
                    {...cardWrapperProps}
                >
                    <div className="text-xs sm:text-sm font-medium text-teal-700 dark:text-teal-300 mb-1">
                        Success Rate
                    </div>
                    <div className="text-teal-900 dark:text-teal-100">
                        <StatValue
                            isLoading={isLoading}
                            isError={isError}
                            value={Math.round(displayStats.overallSuccessRate)}
                            suffix="%"
                        />
                    </div>
                </CardWrapper>
            </div>

            {displayStats.totalWords > 0 && (
                <div className="mt-4 sm:mt-6">
                    <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-2">
                        <span>Learning Progress</span>
                        <span>
                            {startedCount} / {displayStats.totalWords} words started
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
