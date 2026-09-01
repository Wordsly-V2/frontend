"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    CURRENT_PERIOD_LABELS,
    MAX_REPORT_OFFSET,
    type IReportRange,
    type ReportPeriod,
} from "@/types/learning-report/learning-report.type";

const DAY_MONTH = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
});
const DAY_MONTH_YEAR = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
});
const MONTH_YEAR = new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric",
});

/** Parse a 'YYYY-MM-DD' report boundary as a local date. */
function localDate(date: string): Date {
    return new Date(`${date}T00:00:00`);
}

/**
 * Human label for the window on screen — "1 – 7 Jun 2026" for day-bucketed
 * periods, "Jul 2025 – Jun 2026" for the year. The current window keeps its
 * relative name ("Last 7 days") since it always ends today.
 */
export function formatRangeLabel(
    period: ReportPeriod,
    range: IReportRange,
    offset: number,
): string {
    if (offset === 0) {
        return CURRENT_PERIOD_LABELS[period];
    }
    const start = localDate(range.start);
    const end = localDate(range.end);
    if (period === "year") {
        return `${MONTH_YEAR.format(start)} – ${MONTH_YEAR.format(end)}`;
    }
    // Drop the repeated year from the left side when both ends share one.
    const sameYear = start.getFullYear() === end.getFullYear();
    return `${(sameYear ? DAY_MONTH : DAY_MONTH_YEAR).format(start)} – ${DAY_MONTH_YEAR.format(end)}`;
}

interface ReportRangeNavProps {
    period: ReportPeriod;
    range: IReportRange;
    offset: number;
    onChange: (offset: number) => void;
}

/**
 * Steps the report one whole period at a time. Older is unbounded up to the
 * API cap; newer stops at the current window, which is as far forward as the
 * data goes.
 */
export function ReportRangeNav({
    period,
    range,
    offset,
    onChange,
}: Readonly<ReportRangeNavProps>) {
    const atOldest = offset >= MAX_REPORT_OFFSET;
    const atCurrent = offset <= 0;

    return (
        <div className="flex items-center gap-1">
            <Button
                variant="ghost"
                size="icon"
                aria-label={`Previous ${period}`}
                disabled={atOldest}
                onClick={() => onChange(offset + 1)}
            >
                <ChevronLeft className="size-4" />
            </Button>
            <span
                aria-live="polite"
                className="min-w-[11rem] text-center text-sm font-medium tabular-nums"
            >
                {formatRangeLabel(period, range, offset)}
            </span>
            <Button
                variant="ghost"
                size="icon"
                aria-label={`Next ${period}`}
                disabled={atCurrent}
                onClick={() => onChange(offset - 1)}
            >
                <ChevronRight className="size-4" />
            </Button>
            {!atCurrent && (
                <Button
                    variant="outline"
                    size="sm"
                    className="ml-1 rounded-lg"
                    onClick={() => onChange(0)}
                >
                    Today
                </Button>
            )}
        </div>
    );
}
