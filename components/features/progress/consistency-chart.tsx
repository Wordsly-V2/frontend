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
import { Flame, Target, TrendingUp } from "lucide-react";
import type {
    IReportBucket,
    IReportStreaks,
    ReportGranularity,
} from "@/types/learning-report/learning-report.type";
import { ChartCard } from "./chart-card";
import { chartTooltipProps, withLabels } from "./report-format";

interface ConsistencyChartProps {
    buckets: IReportBucket[];
    granularity: ReportGranularity;
    streaks: IReportStreaks;
    activeDays: number;
    goalMetDays: number;
}

function StreakTile({
    icon: Icon,
    label,
    value,
}: Readonly<{
    icon: typeof Flame;
    label: string;
    value: string;
}>) {
    return (
        <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold text-foreground">{value}</p>
            </div>
        </div>
    );
}

export function ConsistencyChart({
    buckets,
    granularity,
    streaks,
    activeDays,
    goalMetDays,
}: Readonly<ConsistencyChartProps>) {
    const data = useMemo(
        () => withLabels(buckets, granularity),
        [buckets, granularity],
    );

    return (
        <ChartCard
            title="Consistency & streaks"
            subtitle={`${activeDays} active ${activeDays === 1 ? "day" : "days"}, ${goalMetDays} on goal`}
        >
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <StreakTile
                    icon={Flame}
                    label="Current streak"
                    value={`${streaks.current} ${streaks.current === 1 ? "day" : "days"}`}
                />
                <StreakTile
                    icon={TrendingUp}
                    label="Longest streak"
                    value={`${streaks.longest} ${streaks.longest === 1 ? "day" : "days"}`}
                />
                <StreakTile
                    icon={Target}
                    label="Goal streak"
                    value={`${streaks.goalStreak} ${streaks.goalStreak === 1 ? "day" : "days"}`}
                />
            </div>
            <div className="h-[200px] w-full min-w-0">
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
                            width={28}
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
                        <Bar
                            name="Active"
                            dataKey="daysActive"
                            fill="var(--chart-1)"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={36}
                        />
                        <Bar
                            name="Goal met"
                            dataKey="goalMetDays"
                            fill="var(--chart-4)"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={36}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}
