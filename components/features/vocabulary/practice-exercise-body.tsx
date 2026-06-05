"use client";

import { cn } from "@/lib/utils";
import { VIEWPORT_EXERCISE_MAX } from "@/lib/long-text";
import type { ReactNode } from "react";

interface PracticeExerciseBodyProps {
    children: ReactNode;
    className?: string;
}

/** Scrollable exercise area so long meanings / sentences never push inputs off-screen. */
export function PracticeExerciseBody({
    children,
    className,
}: Readonly<PracticeExerciseBodyProps>) {
    return (
        <div
            className={cn(
                "flex-1 min-h-0 overflow-y-auto overscroll-contain",
                VIEWPORT_EXERCISE_MAX,
                "-mx-1 px-1",
                className,
            )}
        >
            {children}
        </div>
    );
}
