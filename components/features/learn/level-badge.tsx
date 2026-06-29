"use client";

import { useGetUserLevelQuery } from "@/queries/user-level.query";
import { Sparkles } from "lucide-react";

/**
 * Compact learning-level badge: numeric level + rank, with a progress bar
 * toward the next level. Self-contained — fetches its own data and renders
 * nothing until a level is available.
 */
export function LevelBadge() {
    const { data: level } = useGetUserLevelQuery();
    if (!level) return null;

    return (
        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-[var(--brand-accent)]/5 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[var(--brand-accent)] text-sm font-bold text-primary-foreground tabular-nums">
                        {level.level}
                    </span>
                    <div className="min-w-0">
                        <p className="flex items-center gap-1 text-sm font-semibold leading-tight">
                            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                            Level {level.level}
                        </p>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            {level.rank}
                        </p>
                    </div>
                </div>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                    {level.xpToNextLevel} XP to level {level.level + 1}
                </span>
            </div>
            <div
                className="h-1.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={level.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${level.progress}% to next level`}
            >
                <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-[var(--brand-accent)] transition-all duration-500"
                    style={{ width: `${level.progress}%` }}
                />
            </div>
        </div>
    );
}
