"use client";

import { useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useGetReviewForecastQuery } from "@/queries/learning-report.query";
import type { ForecastDays } from "@/types/learning-report/learning-report.type";
import { ChartCard } from "./chart-card";
import { chartTooltipProps } from "./report-format";

const WEEKDAY = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const DAY_MONTH = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
});

const DAYS_OPTIONS: ForecastDays[] = [7, 30];

/** Local Date from a 'YYYY-MM-DD' key (avoids UTC off-by-one). */
function dayDate(key: string): Date {
    return new Date(`${key}T00:00:00`);
}

function ForecastRangeToggle({
    value,
    onChange,
}: Readonly<{ value: ForecastDays; onChange: (days: ForecastDays) => void }>) {
    return (
        <div
            role="tablist"
            aria-label="Forecast range"
            className="flex items-center rounded-xl border border-border/70 bg-muted/40 p-0.5 dark:bg-muted/25"
        >
            {DAYS_OPTIONS.map((days) => {
                const active = days === value;
                return (
                    <Button
                        key={days}
                        role="tab"
                        aria-selected={active}
                        variant={active ? "default" : "ghost"}
                        size="sm"
                        className={`rounded-lg px-3 ${active ? "shadow-sm" : ""}`}
                        onClick={() => onChange(days)}
                    >
                        {days}d
                    </Button>
                );
            })}
        </div>
    );
}

/** Upcoming-review forecast — how many words come due over the next 7/30 days. */
export function UpcomingReviewsChart() {
    const [days, setDays] = useState<ForecastDays>(7);
    const { data, isLoading } = useGetReviewForecastQuery(days);

    const chartData = useMemo(() => {
        if (!data) return [];
        const bars = data.buckets.map((bucket) => ({
            label: days <= 7
                ? WEEKDAY.format(dayDate(bucket.date))
                : DAY_MONTH.format(dayDate(bucket.date)),
            count: bucket.count,
            isOverdue: false,
        }));
        if (data.overdue > 0) {
            bars.unshift({
                label: "Overdue",
                count: data.overdue,
                isOverdue: true,
            });
        }
        return bars;
    }, [data, days]);

    const total = data?.total ?? 0;
    const subtitle = isLoading
        ? "Loading…"
        : total > 0
          ? `${total.toLocaleString()} review${total === 1 ? "" : "s"} coming up${data && data.overdue > 0 ? ` · ${data.overdue} overdue` : ""}`
          : "Nothing due — you're all caught up.";

    return (
        <ChartCard
            title="Upcoming reviews"
            subtitle={subtitle}
            action={<ForecastRangeToggle value={days} onChange={setDays} />}
        >
            <div className="h-[240px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-border/80"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                            tickLine={false}
                            axisLine={false}
                            className="text-muted-foreground"
                            interval="preserveStartEnd"
                            minTickGap={8}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                            tickLine={false}
                            axisLine={false}
                            className="text-muted-foreground"
                            width={32}
                        />
                        <Tooltip
                            cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                            {...chartTooltipProps}
                            formatter={(value) => [value ?? 0, "Reviews"]}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                            {chartData.map((entry) => (
                                <Cell
                                    key={entry.label}
                                    fill={
                                        entry.isOverdue
                                            ? "var(--chart-5)"
                                            : "var(--chart-1)"
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}
