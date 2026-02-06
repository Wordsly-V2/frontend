"use client";

import { ReactNode } from "react";

interface DataTableProps<T> {
    data: T[];
    columns: {
        key: keyof T | 'actions';
        label: string;
        render?: (item: T) => ReactNode;
    }[];
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
}

export default function DataTable<T extends { id: string }>({
    data,
    columns,
    onRowClick,
    emptyMessage = "No data available",
}: DataTableProps<T>) {
    if (data.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/30">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
                    <svg
                        className="h-8 w-8 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                    </svg>
                </div>
                <p className="text-muted-foreground text-sm sm:text-base px-4">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                {columns.map((column, index) => (
                                    <th
                                        key={index}
                                        className="px-6 py-4 text-left text-sm font-semibold text-foreground"
                                    >
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={() => onRowClick?.(item)}
                                    className={`transition-colors ${
                                        onRowClick ? 'hover:bg-muted/50 cursor-pointer' : ''
                                    }`}
                                >
                                    {columns.map((column, colIndex) => (
                                        <td key={colIndex} className="px-6 py-4 text-sm">
                                            {column.render
                                                ? column.render(item)
                                                : column.key !== 'actions'
                                                ? String(item[column.key])
                                                : null}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {data.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => onRowClick?.(item)}
                        className={`bg-card border border-border rounded-xl p-4 shadow-sm ${
                            onRowClick ? 'active:bg-muted/50 cursor-pointer' : ''
                        }`}
                    >
                        {columns.map((column, index) => {
                            if (column.key === 'actions') {
                                return (
                                    <div key={index} className="flex gap-2 justify-end mt-3 pt-3 border-t border-border">
                                        {column.render?.(item)}
                                    </div>
                                );
                            }
                            return (
                                <div key={index} className="mb-2 last:mb-0">
                                    <span className="text-xs font-medium text-muted-foreground block mb-1">
                                        {column.label}
                                    </span>
                                    <div className="text-sm">
                                        {column.render
                                            ? column.render(item)
                                            : String(item[column.key])}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </>
    );
}
