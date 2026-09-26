"use client";

import { ErrorState, Skeleton } from "@/components/common/states";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Loading and error gate shared by every report section. */
export function SectionGate<T>({
    data,
    isFetching,
    onRetry,
    children,
}: Readonly<{ data: T | undefined; isFetching: boolean; onRetry: () => void; children: (data: T) => ReactNode }>) {
    if (!data && isFetching) {
        return (
            <div aria-busy className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="h-72 w-full rounded-2xl" />
                ))}
            </div>
        );
    }
    if (!data) return <ErrorState message="Couldn't load these numbers." onRetry={onRetry} />;
    return <div className={cn("space-y-4 transition-opacity", isFetching && "opacity-60")}>{children(data)}</div>;
}

/** A plain table inside a chart card: the view that works without a chart. */
export function MiniTable({
    head,
    rows,
    empty,
}: Readonly<{ head: { label: string; numeric?: boolean }[]; rows: ReactNode[][]; empty: string }>) {
    if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border/60 text-xs text-muted-foreground">
                        {head.map((h) => (
                            <th key={h.label} className={cn("px-2 py-2 font-medium", h.numeric ? "text-right" : "text-left")}>
                                {h.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className="border-b border-border/40 last:border-0">
                            {row.map((cell, j) => (
                                <td
                                    key={j}
                                    className={cn("px-2 py-2 align-top", head[j]?.numeric && "text-right tabular-nums")}
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
