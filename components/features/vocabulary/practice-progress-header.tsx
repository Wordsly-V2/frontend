"use client";

import { StreakFlame } from "@/components/common/motion";
import { Button } from "@/components/ui/button";
import { PRACTICE_MODE_META } from "@/lib/practice-mode-meta";
import type { ActivePracticeMode } from "@/lib/practice-settings";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import { Flag, Sparkles } from "lucide-react";

interface PracticeProgressHeaderProps {
    currentIndex: number;
    total: number;
    sessionStreak?: number;
    mode?: ActivePracticeMode;
    xp?: number;
    onEndSession?: () => void;
    endSessionDisabled?: boolean;
    className?: string;
}

export function PracticeProgressHeader({
    currentIndex,
    total,
    sessionStreak = 0,
    mode,
    xp = 0,
    onEndSession,
    endSessionDisabled = false,
    className,
}: Readonly<PracticeProgressHeaderProps>) {
    const reduce = useReducedMotion();
    const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 100;
    const modeMeta = mode ? PRACTICE_MODE_META[mode] : null;
    const ModeIcon = modeMeta?.icon;

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center justify-between gap-2 text-xs font-medium">
                <div className="flex items-center gap-1.5 min-w-0">
                    {modeMeta && ModeIcon && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary shrink-0">
                            <ModeIcon className="h-3 w-3" aria-hidden />
                            <span className="hidden sm:inline">
                                {modeMeta.shortLabel}
                            </span>
                        </span>
                    )}
                    {sessionStreak >= 3 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 font-bold text-orange-600 dark:text-orange-400 shrink-0">
                            <StreakFlame className="h-3 w-3" />
                            {sessionStreak}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {xp > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-warning)]/20 px-2 py-0.5 font-bold tabular-nums text-[var(--brand-orange)]">
                            <Sparkles className="h-3 w-3" aria-hidden />
                            {xp} XP
                        </span>
                    )}
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
                    <span className="tabular-nums text-primary font-bold">
                        {currentIndex + 1}/{total}
                    </span>
                </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-[var(--brand-accent)]"
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={
                        reduce
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 120, damping: 20 }
                    }
                />
            </div>
        </div>
    );
}
