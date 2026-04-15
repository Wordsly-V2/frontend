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
        ? "cursor-pointer hover:shadow-md hover:border-primary/25 transition-[box-shadow,border-color] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
        : "";

    const CardWrapper = isClickable ? "button" : "div";
    const cardWrapperProps = isClickable
        ? { type: "button" as const, onClick: onCardClick }
        : {};

    return (
        <div className={sectionClassName}>
            <div className="mb-4 flex items-center gap-2 sm:mb-6">
                <Brain className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
                <CardWrapper
                    className={`w-full border border-border/70 border-l-4 border-l-primary bg-muted/30 p-3 text-left dark:bg-muted/15 sm:p-4 ${cardHoverClass}`}
                    {...cardWrapperProps}
                >
                    <div className="mb-1 text-xs font-medium text-muted-foreground sm:text-sm">Total words</div>
                    <div className="text-foreground">
                        <StatValue isLoading={isLoading} isError={isError} value={displayStats.totalWords} />
                    </div>
                </CardWrapper>

                <CardWrapper
                    className={`w-full border border-border/70 border-l-4 border-l-emerald-500/90 bg-muted/30 p-3 text-left dark:bg-muted/15 sm:p-4 ${cardHoverClass}`}
                    {...cardWrapperProps}
                >
                    <div className="mb-1 text-xs font-medium text-muted-foreground sm:text-sm">New</div>
                    <div className="text-foreground">
                        <StatValue isLoading={isLoading} isError={isError} value={displayStats.newWords} />
                    </div>
                </CardWrapper>

                <CardWrapper
                    className={`w-full border border-border/70 border-l-4 border-l-amber-500/90 bg-muted/30 p-3 text-left dark:bg-muted/15 sm:p-4 ${cardHoverClass}`}
                    {...cardWrapperProps}
                >
                    <div className="mb-1 text-xs font-medium text-muted-foreground sm:text-sm">Learning</div>
                    <div className="text-foreground">
                        <StatValue isLoading={isLoading} isError={isError} value={displayStats.learningWords} />
                    </div>
                </CardWrapper>

                <CardWrapper
                    className={`w-full border border-border/70 border-l-4 border-l-sky-500/90 bg-muted/30 p-3 text-left dark:bg-muted/15 sm:p-4 ${cardHoverClass}`}
                    {...cardWrapperProps}
                >
                    <div className="mb-1 text-xs font-medium text-muted-foreground sm:text-sm">Review</div>
                    <div className="text-foreground">
                        <StatValue isLoading={isLoading} isError={isError} value={displayStats.reviewWords} />
                    </div>
                </CardWrapper>

                <CardWrapper
                    className={`w-full border border-border/70 border-l-4 border-l-rose-500/90 bg-muted/30 p-3 text-left dark:bg-muted/15 sm:p-4 ${cardHoverClass}`}
                    {...cardWrapperProps}
                >
                    <div className="mb-1 text-xs font-medium text-muted-foreground sm:text-sm">Due today</div>
                    <div className="text-foreground">
                        <StatValue isLoading={isLoading} isError={isError} value={displayStats.dueToday} />
                    </div>
                </CardWrapper>

                <CardWrapper
                    className={`w-full border border-border/70 border-l-4 border-l-teal-500/90 bg-muted/30 p-3 text-left dark:bg-muted/15 sm:p-4 ${cardHoverClass}`}
                    {...cardWrapperProps}
                >
                    <div className="mb-1 text-xs font-medium text-muted-foreground sm:text-sm">Success rate</div>
                    <div className="text-foreground">
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
                            className="h-full rounded-full bg-gradient-to-r from-primary to-[var(--brand-accent)] transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
