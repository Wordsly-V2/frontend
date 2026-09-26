"use client";

import { chartTooltipProps } from "@/components/features/progress/report-format";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface BarPoint {
    /** Axis label. */
    label: string;
    value: number;
    /** Tooltip heading when the axis label is too short to say what the bar is. */
    hint?: string;
}

interface AdminBarChartProps {
    data: BarPoint[];
    /** What one bar counts, e.g. "Learners"; shown in the tooltip. */
    valueName: string;
    height?: number;
}

/**
 * One series of bars, in the progress charts' style: `--chart-1`, recessive
 * grid, rounded data ends. A single series needs no legend; the card title
 * names it.
 */
export function AdminBarChart({ data, valueName, height = 220 }: Readonly<AdminBarChartProps>) {
    return (
        <div className="w-full min-w-0" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                    />
                    <Tooltip
                        cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.hint ?? label}
                        {...chartTooltipProps}
                    />
                    <Bar name={valueName} dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
