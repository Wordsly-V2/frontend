"use client";

import { cn } from "@/lib/utils";
import { VIEWPORT_CARD_MAX } from "@/lib/long-text";
import type { ReactNode } from "react";

interface PracticeCardShellProps {
    children: ReactNode;
    variant?: "default" | "intro" | "result";
    className?: string;
}

export function PracticeCardShell({
    children,
    variant = "default",
    className,
}: Readonly<PracticeCardShellProps>) {
    return (
        <div
            className={cn(
                "relative rounded-2xl sm:rounded-3xl border bg-card",
                "p-4 sm:p-6 md:p-8 flex flex-col min-h-0 overflow-hidden",
                "min-h-[min(320px,55dvh)] sm:min-h-[360px]",
                VIEWPORT_CARD_MAX,
                "shadow-lg shadow-primary/5 transition-shadow duration-300",
                variant === "intro" && "border-primary/25 ring-1 ring-primary/10",
                variant === "result" && "border-border/80",
                variant === "default" && "border-border/80 justify-between",
                className,
            )}
        >
            {children}
        </div>
    );
}
