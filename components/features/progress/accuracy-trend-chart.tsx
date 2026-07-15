"use client";

import { useMemo } from "react";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type {
    IReportBucket,
    ReportGranularity,
} from "@/types/learning-report/learning-report.type";
import { ChartCard } from "./chart-card";
import { chartTooltipProps, withLabels } from "./report-format";

interface AccuracyTrendChartProps {
    buckets: IReportBucket[];
    granularity: ReportGranularity;
    avgAccuracy: number;
}

export function AccuracyTrendChart({
    buckets,
    granularity,
    avgAccuracy,
}: Readonly<AccuracyTrendChartProps>) {
    const data = useMemo(
        () => withLabels(buckets, granularity),
        [buckets, granularity],
    );
    const hasData = useMemo(
        () => buckets.some((bucket) => bucket.reviews > 0),
        [buckets],
    );

    return (
        <ChartCard
            title="Accuracy & improvement"
            subtitle={
                hasData
                    ? `${avgAccuracy}% correct on average`
                    : "Collecting from your next sessions onward"
            }
        >
            {hasData ? (
                <div className="h-[240px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
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
                                domain={[0, 100]}
                                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                tickLine={false}
                                axisLine={false}
                                className="text-muted-foreground"
                                width={36}
                                unit="%"
                            />
                            <Tooltip
                                {...chartTooltipProps}
                                formatter={(value) => [
                                    value == null ? "—" : `${value}%`,
                                    "Accuracy",
                                ]}
                            />
                            <Line
                                type="monotone"
                                dataKey="accuracy"
                                stroke="var(--chart-2)"
                                strokeWidth={2.5}
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center text-sm text-muted-foreground">
                    No review accuracy recorded for this period yet. Keep
                    practicing — your improvement trend builds up from here.
                </div>
            )}
        </ChartCard>
    );
}
