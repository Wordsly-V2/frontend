"use client";

import { StreakFlame } from "@/components/common/motion";
import { Button } from "@/components/ui/button";
import { PRACTICE_MODE_META } from "@/lib/practice-mode-meta";
import type { ActivePracticeMode } from "@/lib/practice-settings";
import { cn } from "@/lib/utils";
import { Sparkles, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface PracticeSessionHeaderProps {
    /** Zero-based index of the current exercise in the queue. */
    currentIndex: number;
    /** Total exercises currently in the queue. */
    total: number;
    /** Consecutive correct answers in this session. */
    sessionStreak?: number;
    /** Active exercise mode — omit to hide the mode chip (e.g. during intros). */
    mode?: ActivePracticeMode;
    xp?: number;
    courseName?: string;
    subtitle?: string;
    /** Leave the session entirely (back to course). */
    onExit?: () => void;
    exitDisabled?: boolean;
    /** Right-aligned slot for toolbar actions (words list, settings…). */
    actions?: ReactNode;
    className?: string;
}

/**
 * Floating glass top bar for the immersive practice "focus mode":
 * exit control, course context, streak flame, XP, and an animated
 * session progress bar. Sticks to the top of the viewport while
 * the learner scrolls long exercise cards.
 */
export function PracticeSessionHeader({
    currentIndex,
    total,
    sessionStreak = 0,
    mode,
    xp = 0,
    courseName,
    subtitle,
    onExit,
    exitDisabled = false,
    actions,
    className,
}: Readonly<PracticeSessionHeaderProps>) {
    const reduce = useReducedMotion();
    const displayIndex = total > 0 ? Math.min(currentIndex + 1, total) : 0;
    const progress = total > 0 ? (displayIndex / total) * 100 : 100;
    const modeMeta = mode ? PRACTICE_MODE_META[mode] : null;
    const ModeIcon = modeMeta?.icon;

    return (
        <header className={cn("sticky top-2 z-30", className)}>
            <div className="glass-surface rounded-2xl px-3 py-2.5 shadow-lg shadow-primary/10 sm:px-4">
                <div className="flex items-center gap-2">
                    {onExit && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onExit}
                            disabled={exitDisabled}
                            className="h-8 w-8 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
                            aria-label="Exit practice session"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}

                    <div className="min-w-0 flex-1">
                        {courseName && (
                            <p className="truncate text-sm font-semibold leading-tight">
                                {courseName}
                            </p>
                        )}
                        {subtitle && (
                            <p className="truncate text-[11px] text-muted-foreground">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {modeMeta && ModeIcon && (
                        <span className="hidden shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary sm:inline-flex">
                            <ModeIcon className="h-3 w-3" aria-hidden />
                            {modeMeta.shortLabel}
                        </span>
                    )}

                    {sessionStreak >= 3 && (
                        <span
                            key={sessionStreak}
                            className="animate-pop inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--brand-warning)]/20 px-2 py-0.5 text-xs font-bold tabular-nums text-[var(--brand-orange)]"
                            aria-label={`${sessionStreak} correct in a row`}
                        >
                            <StreakFlame className="h-3.5 w-3.5" />
                            {sessionStreak}
                        </span>
                    )}

                    {xp > 0 && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold tabular-nums text-primary">
                            <Sparkles className="h-3 w-3" aria-hidden />
                            {xp} XP
                        </span>
                    )}

                    {actions && (
                        <div className="flex shrink-0 items-center [&>div]:mb-0">
                            {actions}
                        </div>
                    )}
                </div>

                <div className="mt-2 flex items-center gap-2.5">
                    <div
                        role="progressbar"
                        aria-label="Session progress"
                        aria-valuemin={0}
                        aria-valuemax={total}
                        aria-valuenow={displayIndex}
                        className="h-2 flex-1 overflow-hidden rounded-full bg-muted/70"
                    >
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-primary via-[var(--brand-accent)] to-[var(--brand-secondary)]"
                            initial={false}
                            animate={{ width: `${progress}%` }}
                            transition={
                                reduce
                                    ? { duration: 0 }
                                    : { type: "spring", stiffness: 120, damping: 20 }
                            }
                        />
                    </div>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-primary">
                        {displayIndex}/{total}
                    </span>
                </div>
            </div>
        </header>
    );
}
