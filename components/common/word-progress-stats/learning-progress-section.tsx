"use client";

import { cn } from "@/lib/utils";
import { IWordProgressStats } from "@/types/courses/courses.type";
import type { ReactNode } from "react";

const DEFAULT_STATS: IWordProgressStats = {
    totalWords: 0,
    newWords: 0,
    learningWords: 0,
    reviewWords: 0,
    dueToday: 0,
    overallSuccessRate: 0,
};

/** The three stages a word moves through, in order, with their bar colors. */
const STAGES = [
    { key: "newWords", label: "New", className: "bg-[var(--brand-secondary)]" },
    { key: "learningWords", label: "Learning", className: "bg-[var(--brand-warning)]" },
    { key: "reviewWords", label: "Review", className: "bg-[var(--brand-success)]" },
] as const;

export interface LearningProgressSectionProps {
    stats?: IWordProgressStats | null;
    title?: string;
    /** One quiet line under the title (e.g. the library size). */
    subtitle?: ReactNode;
    /** Top-right slot, e.g. a link to /progress. */
    action?: ReactNode;
    className?: string;
    /** Shows placeholders instead of numbers. */
    isLoading?: boolean;
    /** Shows "--" instead of numbers. */
    isError?: boolean;
    /** Makes the card a retry button (e.g. after an error). */
    onCardClick?: () => void;
}

/**
 * Where a set of words stands: one bar split by stage, then the counts, what is
 * due today and the success rate. Used for all words (/learn), a course and a
 * course being edited.
 */
export default function LearningProgressSection({
    stats,
    title = "Learning progress",
    subtitle,
    action,
    className,
    isLoading = false,
    isError = false,
    onCardClick,
}: Readonly<LearningProgressSectionProps>) {
    const s = stats ?? DEFAULT_STATS;
    const total = s.totalWords;
    const started = s.learningWords + s.reviewWords;
    const blank = isLoading || isError;

    const value = (n: number, suffix = "") => {
        if (isLoading) return <span className="inline-block h-6 w-8 animate-pulse rounded-md bg-muted align-middle" />;
        if (isError) return "--";
        return `${n}${suffix}`;
    };

    const body = (
        <>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="font-display text-lg font-bold">{title}</h2>
                    {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                </div>
                {action}
            </div>

            <div
                className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted"
                role="img"
                aria-label={
                    blank
                        ? "Progress not loaded"
                        : `${started} of ${total} words started: ${STAGES.map((st) => `${s[st.key]} ${st.label.toLowerCase()}`).join(", ")}`
                }
            >
                {!blank &&
                    total > 0 &&
                    STAGES.map((st) =>
                        s[st.key] > 0 ? (
                            <div key={st.key} className={cn("h-full", st.className)} style={{ width: `${(s[st.key] / total) * 100}%` }} />
                        ) : null,
                    )}
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-5">
                {STAGES.map((st) => (
                    <div key={st.key}>
                        <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <span aria-hidden className={cn("h-2.5 w-2.5 rounded-full", st.className)} />
                            {st.label}
                        </dt>
                        <dd className="font-display text-xl font-bold tabular-nums">{value(s[st.key])}</dd>
                    </div>
                ))}
                <div>
                    <dt className="text-xs font-semibold text-muted-foreground">Due today</dt>
                    <dd className="font-display text-xl font-bold tabular-nums">{value(s.dueToday)}</dd>
                </div>
                <div>
                    <dt className="text-xs font-semibold text-muted-foreground">Success</dt>
                    <dd className="font-display text-xl font-bold tabular-nums">{value(Math.round(s.overallSuccessRate), "%")}</dd>
                </div>
            </dl>
        </>
    );

    const cardClass = cn("surface-card block w-full p-5 text-left", className);

    if (onCardClick) {
        return (
            <button
                type="button"
                onClick={onCardClick}
                className={cn(cardClass, "transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50")}
            >
                {body}
            </button>
        );
    }
    return <section className={cardClass}>{body}</section>;
}
