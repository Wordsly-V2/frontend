"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionHeaderRowProps {
    children: ReactNode;
    actions?: ReactNode;
    className?: string;
}

/** Title + actions row that stays stable with long text on wide screens. */
export function SectionHeaderRow({
    children,
    actions,
    className,
}: Readonly<SectionHeaderRowProps>) {
    return (
        <div
            className={cn(
                "grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-6",
                className,
            )}
        >
            <div className="min-w-0">{children}</div>
            {actions ? (
                <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:min-w-[9.5rem] sm:max-w-[16rem]">
                    {actions}
                </div>
            ) : null}
        </div>
    );
}
