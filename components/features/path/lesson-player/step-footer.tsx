"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

/**
 * The bottom action of a lesson step. Enter presses it, unless the learner is
 * typing in a field (the field handles its own Enter).
 */
export function StepFooter({
    label = "Continue",
    onClick,
    disabled = false,
    children,
    className,
}: Readonly<{
    label?: string;
    onClick: () => void;
    disabled?: boolean;
    /** Extra content left of the button (feedback, a secondary action). */
    children?: React.ReactNode;
    className?: string;
}>) {
    useEffect(() => {
        if (disabled) return;
        const onKey = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (event.key !== "Enter" || target?.closest("input, textarea, button")) return;
            event.preventDefault();
            onClick();
        };
        globalThis.addEventListener("keydown", onKey);
        return () => globalThis.removeEventListener("keydown", onKey);
    }, [disabled, onClick]);

    return (
        <div className={cn("mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
            <div className="min-w-0 flex-1">{children}</div>
            <Button variant="play" size="lg" onClick={onClick} disabled={disabled} className="sm:min-w-40">
                {label}
            </Button>
        </div>
    );
}
