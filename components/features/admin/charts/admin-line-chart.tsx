"use client";

import { chartTooltipProps } from "@/components/features/progress/report-format";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface LinePoint {
    label: string;
    /** `null` is a gap (no data that day), not zero. */
    value: number | null;
}

interface AdminPercentLineChartProps {
    data: LinePoint[];
    valueName: string;
    height?: number;
}

/** A 0–100% line with gaps for days without data. */
export function AdminPercentLineChart({ data, valueName, height = 220 }: Readonly<AdminPercentLineChartProps>) {
    return (
        <div className="w-full min-w-0" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/80" vertical={false} />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={8}
                    />
                    <YAxis
                        domain={[0, 100]}
                        tickFormatter={(v: number) => `${v}%`}
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                        width={48}
                    />
                    <Tooltip
                        cursor={{ stroke: "var(--border)" }}
                        formatter={(v) => [`${v}%`, valueName]}
                        {...chartTooltipProps}
                    />
                    <Line
                        name={valueName}
                        dataKey="value"
                        type="monotone"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                        connectNulls={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
