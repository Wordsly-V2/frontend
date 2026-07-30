"use client";

import { useMemo } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
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

interface WordsOverTimeChartProps {
    buckets: IReportBucket[];
    granularity: ReportGranularity;
    newWords: number;
    reviewedWords: number;
}

export function WordsOverTimeChart({
    buckets,
    granularity,
    newWords,
    reviewedWords,
}: Readonly<WordsOverTimeChartProps>) {
    const data = useMemo(
        () => withLabels(buckets, granularity),
        [buckets, granularity],
    );

    return (
        <ChartCard
            title="New & reviewed words"
            subtitle={`${newWords.toLocaleString()} new · ${reviewedWords.toLocaleString()} reviewed this ${granularity === "month" ? "year" : "period"}`}
        >
            <div className="h-[240px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
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
                        />
                        <Legend
                            wrapperStyle={{ fontSize: "11px" }}
                            iconType="circle"
                            formatter={(value) => (
                                <span className="text-muted-foreground">
                                    {value}
                                </span>
                            )}
                        />
                        {/* Stacked: the two series add up to the words practiced that bucket. */}
                        <Bar
                            name="New"
                            dataKey="newWords"
                            stackId="words"
                            fill="var(--chart-2)"
                            maxBarSize={48}
                        />
                        <Bar
                            name="Reviewed"
                            dataKey="reviewedWords"
                            stackId="words"
                            fill="var(--chart-1)"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={48}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}
