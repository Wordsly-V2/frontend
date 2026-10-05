"use client";

import { cn } from "@/lib/utils";
import { VIEWPORT_CARD_MAX } from "@/lib/long-text";
import type { ReactNode } from "react";

interface PracticeCardShellProps {
    children: ReactNode;
    /**
     * `default`: an exercise, height-capped so its input stays on screen.
     * `result`: answer feedback, which flows with the page (the footer bar
     * holds Continue, so nothing has to stay in view) and has no surface of
     * its own: the word card inside it is the surface.
     */
    variant?: "default" | "result";
    className?: string;
}

/** The one surface an exercise sits on during a session. */
export function PracticeCardShell({
    children,
    variant = "default",
    className,
}: Readonly<PracticeCardShellProps>) {
    return (
        <div
            className={cn(
                "relative flex min-h-0 flex-col",
                variant === "default" && [
                    "min-h-[min(320px,55dvh)] justify-between overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:min-h-[360px] sm:p-8",
                    VIEWPORT_CARD_MAX,
                ],
                className,
            )}
        >
            {children}
        </div>
    );
}
