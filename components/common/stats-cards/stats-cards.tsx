"use client";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BookOpen, FileText, MessageSquare } from "lucide-react";
import { type ReactNode } from "react";

export interface StatsCardItem {
    id: string;
    label: string;
    value: number;
    icon: ReactNode;
    /** Tailwind classes for the icon container (e.g. gradient-brand, gradient-accent, bg-gradient-to-br from-green-500 to-emerald-600) */
    iconClassName: string;
}

export interface CourseTotalStats {
    totalCourses: number;
    totalLessons: number;
    totalWords: number;
}

/** Build stat items for Courses / Lessons / Words from course total stats. */
export function getCourseTotalStatsItems(
    stats: CourseTotalStats | null | undefined
): StatsCardItem[] {
    return [
        {
            id: "courses",
            label: "Courses",
            value: stats?.totalCourses ?? 0,
            icon: <BookOpen className="text-white" />,
            iconClassName: "gradient-brand",
        },
        {
            id: "lessons",
            label: "Lessons",
            value: stats?.totalLessons ?? 0,
            icon: <FileText className="text-white" />,
            iconClassName: "gradient-accent",
        },
        {
            id: "words",
            label: "Words",
            value: stats?.totalWords ?? 0,
            icon: <MessageSquare className="text-white" />,
            iconClassName: "bg-gradient-to-br from-green-500 to-emerald-600",
        },
    ];
}

export interface StatsCardsProps {
    items: CourseTotalStats | null | undefined;
    isLoading?: boolean;
    isError?: boolean;
    /** Called when a card is clicked (e.g. to retry loading). Optional. */
    onCardClick?: () => void;
    className?: string;
}

export default function StatsCards({
    items,
    isLoading = false,
    isError = false,
    onCardClick,
    className = "",
}: Readonly<StatsCardsProps>) {
    const statsItems = getCourseTotalStatsItems(items);
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 ${className}`.trim()}>
            {statsItems.map((item) => {
                let valueContent: ReactNode;
                if (isLoading) {
                    valueContent = <LoadingSpinner size="sm" />;
                } else if (isError) {
                    valueContent = <p className="text-2xl sm:text-3xl font-bold">--</p>;
                } else {
                    valueContent = <p className="text-2xl sm:text-3xl font-bold">{item.value}</p>;
                }
                const cardContent = (
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div
                            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ${item.iconClassName}`}
                        >
                            <span className="[&>svg]:h-6 [&>svg]:w-6 sm:[&>svg]:h-7 sm:[&>svg]:w-7 [&>svg]:text-white">
                                {item.icon}
                            </span>
                        </div>
                        <div className="min-w-0">
                            {valueContent}
                            <p className="text-xs sm:text-sm text-muted-foreground">{item.label}</p>
                        </div>
                    </div>
                );
                const cardClassName = "w-full text-left bg-card border-2 border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-primary/50 transition-all cursor-pointer card-hover";
                return onCardClick ? (
                    <button
                        key={item.id}
                        type="button"
                        className={cardClassName}
                        onClick={onCardClick}
                    >
                        {cardContent}
                    </button>
                ) : (
                    <div key={item.id} className={cardClassName}>
                        {cardContent}
                    </div>
                );
            })}
        </div>
    );
}
