"use client";

import { getPracticeModeMeta } from "@/lib/practice-mode-meta";
import type { ActivePracticeMode } from "@/lib/practice-settings";
import { stageLabel, type WordLearningStage } from "@/lib/word-progress-stage";
import { cn } from "@/lib/utils";

interface PracticeExerciseHeaderProps {
    mode: ActivePracticeMode;
    stage: WordLearningStage;
    roundLabel?: string;
    className?: string;
}

export function PracticeExerciseHeader({
    mode,
    stage,
    roundLabel,
    className,
}: Readonly<PracticeExerciseHeaderProps>) {
    const meta = getPracticeModeMeta(mode);
    const Icon = meta.icon;

    return (
        <div className={cn("mb-5 sm:mb-6 text-center", className)}>
            <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {meta.shortLabel}
                    {roundLabel && (
                        <span className="text-primary/70 font-normal">{roundLabel}</span>
                    )}
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {stageLabel(stage)}
                </span>
            </div>
            <p className="text-sm text-muted-foreground">{meta.instruction}</p>
        </div>
    );
}
