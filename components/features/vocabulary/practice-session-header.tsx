"use client";

import { StreakFlame } from "@/components/common/motion";
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
 * The top of every full-screen session (practice, Path lessons, tests): exit,
 * a thick progress bar and the count on the first line; where you are, the
 * exercise type, streak, XP and tools on the second. Sticks to the top while
 * a long card scrolls.
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
    const context = [courseName, subtitle].filter(Boolean).join(" · ");

    return (
        <header className={cn("sticky top-0 z-30 bg-background/85 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl", className)}>
            <div className="flex items-center gap-3">
                {onExit && (
                    <button
                        type="button"
                        onClick={onExit}
                        disabled={exitDisabled}
                        className="-ml-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        aria-label="Exit session"
                    >
                        <X className="h-6 w-6" strokeWidth={2.5} />
                    </button>
                )}

                <div
                    role="progressbar"
                    aria-label="Session progress"
                    aria-valuemin={0}
                    aria-valuemax={total}
                    aria-valuenow={displayIndex}
                    className="relative h-4 flex-1 overflow-hidden rounded-full bg-muted"
                >
                    <motion.div
                        className="relative h-full rounded-full bg-gradient-to-r from-primary to-[var(--brand-pink)]"
                        initial={false}
                        animate={{ width: `${Math.max(progress, 4)}%` }}
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 }}
                    >
                        {/* Glossy highlight along the top of the fill. */}
                        <span aria-hidden className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/35" />
                    </motion.div>
                </div>

                <span className="shrink-0 text-sm font-extrabold tabular-nums text-muted-foreground">
                    {displayIndex}
                    <span className="font-semibold opacity-60">/{total}</span>
                </span>
            </div>

            <div className="mt-2 flex min-h-8 items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-xs font-semibold text-muted-foreground" title={context || undefined}>
                    {context}
                </p>

                {modeMeta && ModeIcon && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
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

                {actions && <div className="-mr-1.5 flex shrink-0 items-center [&>div]:mb-0">{actions}</div>}
            </div>
        </header>
    );
}
