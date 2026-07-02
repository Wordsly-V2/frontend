"use client";

import { cn } from "@/lib/utils";
import { useGetUserLevelQuery } from "@/queries/user-level.query";

/**
 * Compact learning-level glass tile: numeric level + rank, with a progress
 * bar toward the next level. Self-contained — fetches its own data and
 * renders nothing until a level is available. Sized to sit in the stat strip.
 */
export function LevelBadge({ className }: Readonly<{ className?: string }>) {
    const { data: level } = useGetUserLevelQuery();
    if (!level) return null;

    return (
        <div className={cn("glass-surface rounded-2xl px-3 py-2", className)}>
            <div className="flex items-center gap-2">
                <span className="gradient-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white tabular-nums">
                    {level.level}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wide leading-none text-muted-foreground">
                        {level.rank}
                    </p>
                    <p className="truncate text-lg font-bold tabular-nums leading-tight">
                        Level {level.level}
                        <span className="text-xs font-medium text-muted-foreground">
                            {" "}
                            · {level.xpToNextLevel} XP to next
                        </span>
                    </p>
                </div>
            </div>
            <div
                className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={level.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${level.progress}% to level ${level.level + 1}`}
            >
                <div
                    className="gradient-accent h-full rounded-full transition-all duration-500"
                    style={{ width: `${level.progress}%` }}
                />
            </div>
        </div>
    );
}
