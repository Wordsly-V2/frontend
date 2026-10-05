"use client";

import { getPracticeModeMeta } from "@/lib/practice-mode-meta";
import type { ActivePracticeMode } from "@/lib/practice-settings";
import { stageLabel, type WordLearningStage } from "@/lib/word-progress-stage";
import { cn } from "@/lib/utils";

interface PracticeExerciseHeaderProps {
    mode: ActivePracticeMode;
    stage: WordLearningStage;
    /** A new word's round, e.g. " · 1/3". */
    roundLabel?: string;
    className?: string;
}

/**
 * What to do, said once and clearly at the top of the card, with the word's
 * stage underneath. The exercise type itself is in the session header.
 */
export function PracticeExerciseHeader({
    mode,
    stage,
    roundLabel,
    className,
}: Readonly<PracticeExerciseHeaderProps>) {
    const meta = getPracticeModeMeta(mode);
    const round = roundLabel?.replace(/^\s*·\s*/, "");

    return (
        <div className={cn("mb-6 text-center sm:mb-7", className)}>
            <p className="font-display text-lg font-bold leading-snug text-balance sm:text-xl">{meta.instruction}</p>
            <div className="mt-2 inline-flex flex-wrap items-center justify-center gap-1.5">
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {stageLabel(stage)}
                </span>
                {round && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary tabular-nums">
                        Round {round}
                    </span>
                )}
            </div>
        </div>
    );
}
