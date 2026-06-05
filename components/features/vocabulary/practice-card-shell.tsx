"use client";

import { cn } from "@/lib/utils";
import { VIEWPORT_CARD_MAX } from "@/lib/long-text";
import type { ReactNode } from "react";

interface PracticeCardShellProps {
    children: ReactNode;
    variant?: "default" | "intro";
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
                "bg-gradient-to-br from-card to-card/50 border-2 rounded-2xl sm:rounded-3xl",
                "p-4 sm:p-8 md:p-10 mb-4 sm:mb-6 flex flex-col min-h-[280px] sm:min-h-[320px]",
                VIEWPORT_CARD_MAX,
                "shadow-xl shadow-primary/5",
                variant === "intro" ? "border-primary/20" : "border-border justify-between",
                className,
            )}
        >
            {children}
        </div>
    );
}
