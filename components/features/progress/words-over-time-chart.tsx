"use client";

import { useMemo } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
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
import { withLabels } from "./report-format";

interface WordsOverTimeChartProps {
    buckets: IReportBucket[];
    granularity: ReportGranularity;
    total: number;
}

export function WordsOverTimeChart({
    buckets,
    granularity,
    total,
}: Readonly<WordsOverTimeChartProps>) {
    const data = useMemo(
        () => withLabels(buckets, granularity),
        [buckets, granularity],
    );

    return (
        <ChartCard
            title="Words learned over time"
            subtitle={`${total.toLocaleString()} words this ${granularity === "month" ? "year" : "period"}`}
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
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            className="text-muted-foreground"
                            interval="preserveStartEnd"
                            minTickGap={8}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            className="text-muted-foreground"
                            width={32}
                        />
                        <Tooltip
                            cursor={{ fill: "hsl(var(--muted))", opacity: 0.35 }}
                            contentStyle={{
                                borderRadius: "8px",
                                border: "1px solid hsl(var(--border))",
                                background: "hsl(var(--card))",
                                fontSize: "12px",
                            }}
                            formatter={(value) => [value ?? 0, "Words"]}
                        />
                        <Bar
                            dataKey="wordsPracticed"
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
