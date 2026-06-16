"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Flag, Flame } from "lucide-react";

interface PracticeProgressHeaderProps {
    currentIndex: number;
    total: number;
    sessionStreak?: number;
    onEndSession?: () => void;
    endSessionDisabled?: boolean;
    className?: string;
}

export function PracticeProgressHeader({
    currentIndex,
    total,
    sessionStreak = 0,
    onEndSession,
    endSessionDisabled = false,
    className,
}: Readonly<PracticeProgressHeaderProps>) {
    const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 100;

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center justify-between gap-2 text-xs font-medium">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-muted-foreground truncate">Progress</span>
                    {sessionStreak >= 3 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-orange-600 dark:text-orange-400 font-semibold shrink-0">
                            <Flame className="h-3 w-3" aria-hidden />
                            {sessionStreak}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {onEndSession && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onEndSession}
                            disabled={endSessionDisabled}
                            className="h-7 gap-1 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground"
                            aria-label="End session and save progress"
                        >
                            <Flag className="h-3.5 w-3.5" aria-hidden />
                            <span className="hidden sm:inline">End session</span>
                        </Button>
                    )}
                    <span className="tabular-nums text-primary font-semibold">
                        {currentIndex + 1}/{total}
                    </span>
                </div>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-[var(--brand-accent)] transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
