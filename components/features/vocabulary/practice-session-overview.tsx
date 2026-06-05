"use client";

import { Button } from "@/components/ui/button";
import {
    stageLabel,
    type SessionStageCounts,
    type WordLearningStage,
} from "@/lib/word-progress-stage";
import { BookOpen, Brain, Sparkles, Timer } from "lucide-react";

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
    hasIntro: boolean;
    isReviewSession: boolean;
    onStart: () => void;
}

export function PracticeSessionOverview({
    counts,
    totalWords,
    hasIntro,
    isReviewSession,
    onStart,
}: Readonly<PracticeSessionOverviewProps>) {
    const stages = (Object.entries(counts) as [WordLearningStage, number][]).filter(
        ([, n]) => n > 0,
    );

    return (
        <section className="flex flex-col flex-1 min-h-0 animate-in fade-in duration-300">
            <div className="rounded-2xl border border-border bg-card/80 p-4 sm:p-6 mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                    Your session
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                    {isReviewSession
                        ? "Review mode — active recall, no hints. Due words come first."
                        : hasIntro
                          ? "New words get a quick intro, then practice runs due → learning → new → review."
                          : "All words have been seen before — straight to active practice."}
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

            <div className="flex-shrink-0 flex justify-center pt-2">
                <Button size="lg" onClick={onStart} className="min-w-[200px] rounded-xl">
                    {hasIntro ? "Preview new words" : "Start practice"}
                </Button>
            </div>
        </section>
    );
}
