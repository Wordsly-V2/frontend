"use client";

import { Button } from "@/components/ui/button";
import { useEnterKeyAction } from "@/lib/keyboard-utils";
import {
    stageLabel,
    type SessionStageCounts,
    type WordLearningStage,
} from "@/lib/word-progress-stage";
import { PEDAGOGY } from "@/lib/learning-pedagogy";
import { formatSessionEstimate } from "@/lib/practice-session-estimate";
import { BookOpen, Brain, Clock, Sparkles, Timer } from "lucide-react";
import { useCallback } from "react";

const STAGE_STYLES: Record<
    WordLearningStage,
    { icon: typeof Sparkles; className: string }
> = {
    new: { icon: Sparkles, className: "text-chart-1" },
    learning: { icon: BookOpen, className: "text-chart-2" },
    review: { icon: Brain, className: "text-chart-3" },
    due: { icon: Timer, className: "text-chart-4" },
};

interface PracticeSessionOverviewProps {
    counts: SessionStageCounts;
    totalWords: number;
    /** Total exercises including new-word repetitions. */
    exerciseCount: number;
    newWordCount: number;
    isReviewSession: boolean;
    onStart: () => void;
}

export function PracticeSessionOverview({
    counts,
    totalWords,
    exerciseCount,
    newWordCount,
    isReviewSession,
    onStart,
}: Readonly<PracticeSessionOverviewProps>) {
    const stages = (Object.entries(counts) as [WordLearningStage, number][]).filter(
        ([, n]) => n > 0,
    );
    const hasNewWords = newWordCount > 0;
    const timeEstimate = formatSessionEstimate(exerciseCount, hasNewWords, counts);
    const handleStart = useCallback(() => onStart(), [onStart]);

    useEnterKeyAction(handleStart, true);

    return (
        <section className="flex flex-col flex-1 min-h-0 animate-in fade-in duration-300">
            <div className="rounded-2xl border border-border bg-card/80 p-4 sm:p-6 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Your session
                    </p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        {timeEstimate}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                    {isReviewSession && !hasNewWords
                        ? "Time to recall — due words first, hints stay off so you really remember."
                        : hasNewWords
                          ? `${newWordCount} new word${newWordCount === 1 ? "" : "s"}: Learn once, then ${PEDAGOGY.newWordSessionRepetitions} practice rounds each (recognition → production). Due and learning words come first.`
                          : "You have seen these before — straight into active practice."}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {stages.map(([stage, count]) => {
                        const { icon: Icon, className } = STAGE_STYLES[stage];
                        return (
                            <div
                                key={stage}
                                className="rounded-xl border border-border/70 bg-muted/30 px-3 py-3 text-center dark:bg-muted/15"
                            >
                                <Icon className={`h-5 w-5 mx-auto mb-1.5 ${className}`} aria-hidden />
                                <p className="text-2xl font-bold tabular-nums">{count}</p>
                                <p className="text-xs text-muted-foreground">{stageLabel(stage)}</p>
                            </div>
                        );
                    })}
                </div>
                {stages.length === 0 && (
                    <p className="text-sm text-muted-foreground">{totalWords} words ready</p>
                )}
            </div>

            <div className="flex-shrink-0 flex flex-col items-center gap-2 pt-2">
                <Button size="lg" onClick={handleStart} className="min-w-[200px] rounded-xl">
                    Start practice
                </Button>
                <p className="text-xs text-muted-foreground">Press Enter to start</p>
            </div>
        </section>
    );
}
