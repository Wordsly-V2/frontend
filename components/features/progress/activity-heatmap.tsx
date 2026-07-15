"use client";

import { useMemo } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useGetActivityCalendarQuery } from "@/queries/learning-report.query";
import type { IActivityDay } from "@/types/learning-report/learning-report.type";
import { ChartCard } from "./chart-card";

const MONTH = new Intl.DateTimeFormat(undefined, { month: "short" });
const FULL_DATE = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
});

/** Local Date from a 'YYYY-MM-DD' key (avoids UTC off-by-one). */
function dayDate(key: string): Date {
    return new Date(`${key}T00:00:00`);
}

interface Cell {
    day: IActivityDay | null;
}

/** Bucket a word count into a 0–4 intensity level for the color ramp. */
function intensityLevel(words: number, max: number): number {
    if (words <= 0 || max <= 0) return 0;
    return Math.min(4, Math.ceil((words / max) * 4));
}

const LEVEL_PERCENT = [0, 25, 50, 75, 100] as const;

/** GitHub-style contribution heatmap — pure CSS grid, no charting library. */
export function ActivityHeatmap() {
    const { data, isLoading } = useGetActivityCalendarQuery();

    const { weeks, monthLabels, maxWords, activeDays } = useMemo(() => {
        const days = data?.days ?? [];
        if (days.length === 0) {
            return { weeks: [] as Cell[][], monthLabels: [] as string[], maxWords: 0, activeDays: 0 };
        }

        const max = days.reduce((m, d) => Math.max(m, d.wordsPracticed), 0);
        const active = days.filter((d) => d.wordsPracticed > 0).length;

        // Pad the front so the first real day lands on its weekday row (0 = Sun).
        const leadingPad = dayDate(days[0].date).getDay();
        const cells: Cell[] = [
            ...Array.from({ length: leadingPad }, () => ({ day: null })),
            ...days.map((day) => ({ day })),
        ];
        // Pad the tail to a whole week so the grid stays rectangular.
        while (cells.length % 7 !== 0) cells.push({ day: null });

        const weekCols: Cell[][] = [];
        for (let i = 0; i < cells.length; i += 7) {
            weekCols.push(cells.slice(i, i + 7));
        }

        // One label per column: the month name when a column opens a new month.
        let lastMonth = -1;
        const labels = weekCols.map((week) => {
            const firstReal = week.find((c) => c.day)?.day;
            if (!firstReal) return "";
            const month = dayDate(firstReal.date).getMonth();
            if (month !== lastMonth) {
                lastMonth = month;
                return MONTH.format(dayDate(firstReal.date));
            }
            return "";
        });

        return { weeks: weekCols, monthLabels: labels, maxWords: max, activeDays: active };
    }, [data]);

    const subtitle = isLoading
        ? "Loading…"
        : `${activeDays} active day${activeDays === 1 ? "" : "s"} · a ring marks days you hit your goal`;

    return (
        <ChartCard title="Practice activity" subtitle={subtitle}>
            <div className="w-full overflow-x-auto">
                <TooltipProvider delayDuration={100}>
                    <div className="inline-flex flex-col gap-1">
                        {/* Month labels aligned to their week column */}
                        <div className="flex gap-1 pl-0">
                            {monthLabels.map((label, i) => (
                                <div
                                    key={`m-${i}`}
                                    className="w-3 text-[10px] leading-none text-muted-foreground sm:w-3.5"
                                >
                                    {label}
                                </div>
                            ))}
                        </div>

                        {/* 7 rows (weekdays) × N columns (weeks), filled column-first */}
                        <div className="grid grid-flow-col grid-rows-7 gap-1">
                            {weeks.flatMap((week, wi) =>
                                week.map((cell, di) => {
                                    if (!cell.day) {
                                        return (
                                            <div
                                                key={`${wi}-${di}`}
                                                className="h-3 w-3 rounded-[3px] bg-transparent sm:h-3.5 sm:w-3.5"
                                            />
                                        );
                                    }
                                    const { date, wordsPracticed, goalMet } = cell.day;
                                    const level = intensityLevel(wordsPracticed, maxWords);
                                    const label = `${FULL_DATE.format(dayDate(date))}: ${wordsPracticed} word${wordsPracticed === 1 ? "" : "s"}${goalMet ? " · goal met" : ""}`;
                                    return (
                                        <Tooltip key={`${wi}-${di}`}>
                                            <TooltipTrigger asChild>
                                                <div
                                                    title={label}
                                                    aria-label={label}
                                                    className={cn(
                                                        "h-3 w-3 rounded-[3px] sm:h-3.5 sm:w-3.5",
                                                        level === 0 && "bg-muted",
                                                        goalMet &&
                                                            "ring-2 ring-[var(--chart-4)] ring-offset-1 ring-offset-card",
                                                    )}
                                                    style={
                                                        level > 0
                                                            ? {
                                                                  backgroundColor: `color-mix(in oklab, var(--chart-1) ${LEVEL_PERCENT[level]}%, transparent)`,
                                                              }
                                                            : undefined
                                                    }
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent>{label}</TooltipContent>
                                        </Tooltip>
                                    );
                                }),
                            )}
                        </div>
                    </div>
                </TooltipProvider>
            </div>
        </ChartCard>
    );
}
