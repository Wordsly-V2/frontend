"use client";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { IWordProgressStats } from "@/types/courses/courses.type";
import { useMemo } from "react";
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

export interface LearningProgressChartProps {
    stats?: IWordProgressStats | null;
    isLoading?: boolean;
    isError?: boolean;
    className?: string;
}

const COLORS = {
    new: "var(--chart-1)",
    learning: "var(--chart-2)",
    review: "var(--chart-3)",
    due: "var(--chart-4)",
};

export function LearningProgressChart({
    stats,
    isLoading = false,
    isError = false,
    className = "",
}: Readonly<LearningProgressChartProps>) {
    const data = useMemo(() => {
        if (!stats) {
            return [];
        }
        return [
            { label: "New", value: stats.newWords, fill: COLORS.new },
            { label: "Learning", value: stats.learningWords, fill: COLORS.learning },
            { label: "Review", value: stats.reviewWords, fill: COLORS.review },
            { label: "Due today", value: stats.dueToday, fill: COLORS.due },
        ];
    }, [stats]);

    if (isLoading) {
        return (
            <div
                className={`flex min-h-[220px] items-center justify-center rounded-xl border border-border bg-card ${className}`}
            >
                <LoadingSpinner size="md" label="Loading chart…" />
            </div>
        );
    }

    if (isError || !stats) {
        return (
            <div
                className={`flex min-h-[220px] items-center justify-center rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground ${className}`}
            >
                Chart unavailable
            </div>
        );
    }

    return (
        <div
            className={`rounded-xl border border-border bg-card p-4 sm:p-5 ${className}`}
        >
            <p className="mb-4 text-sm font-medium text-muted-foreground">
                Words by stage
            </p>
            <div className="h-[220px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/80" vertical={false} />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            className="text-muted-foreground"
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
                            formatter={(value) => [value ?? "—", "Words"]}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                            {data.map((entry) => (
                                <Cell key={entry.label} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
