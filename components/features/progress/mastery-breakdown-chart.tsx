"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { IReportMastery } from "@/types/learning-report/learning-report.type";
import { ChartCard } from "./chart-card";
import { chartTooltipProps } from "./report-format";

interface MasteryBreakdownChartProps {
    mastery: IReportMastery;
}

const SEGMENTS = [
    { key: "learningWords", label: "Learning", color: "var(--chart-2)" },
    { key: "reviewWords", label: "Reviewing", color: "var(--chart-3)" },
    { key: "masteredWords", label: "Mastered", color: "var(--chart-1)" },
] as const;

export function MasteryBreakdownChart({
    mastery,
}: Readonly<MasteryBreakdownChartProps>) {
    const data = useMemo(
        () =>
            SEGMENTS.map((segment) => ({
                label: segment.label,
                value: mastery[segment.key],
                color: segment.color,
            })).filter((segment) => segment.value > 0),
        [mastery],
    );

    return (
        <ChartCard
            title="Mastery breakdown"
            subtitle={`${mastery.totalStarted.toLocaleString()} words started`}
        >
            {mastery.totalStarted === 0 ? (
                <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center text-sm text-muted-foreground">
                    Start practicing words to see how your mastery grows.
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <div className="h-[200px] w-full min-w-0 sm:w-1/2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    dataKey="value"
                                    nameKey="label"
                                    innerRadius="58%"
                                    outerRadius="86%"
                                    paddingAngle={2}
                                    stroke="none"
                                >
                                    {data.map((segment) => (
                                        <Cell
                                            key={segment.label}
                                            fill={segment.color}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    {...chartTooltipProps}
                                    formatter={(value, name) => [value, name]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <ul className="w-full space-y-2 sm:w-1/2">
                        {SEGMENTS.map((segment) => (
                            <li
                                key={segment.key}
                                className="flex items-center justify-between gap-3 text-sm"
                            >
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <span
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{ background: segment.color }}
                                    />
                                    {segment.label}
                                </span>
                                <span className="font-semibold text-foreground">
                                    {mastery[segment.key].toLocaleString()}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </ChartCard>
    );
}
