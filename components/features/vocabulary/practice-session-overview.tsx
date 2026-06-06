"use client";

import { Button } from "@/components/ui/button";
import { useEnterKeyAction } from "@/lib/keyboard-utils";
import { PEDAGOGY } from "@/lib/learning-pedagogy";
import { formatSessionEstimate } from "@/lib/practice-session-estimate";
import {
    stageLabel,
    type SessionStageCounts,
    type WordLearningStage,
} from "@/lib/word-progress-stage";
import { cn } from "@/lib/utils";
import {
    ArrowRight,
    BookOpen,
    Brain,
    Clock,
    Layers,
    Sparkles,
    Timer,
    Zap,
} from "lucide-react";
import { useCallback } from "react";

const STAGE_CONFIG: Record<
    WordLearningStage,
    { icon: typeof Sparkles; color: string; description: string }
> = {
    due: {
        icon: Timer,
        color: "text-chart-4",
        description: "Due for review — recall first, no hints",
    },
    review: {
        icon: Brain,
        color: "text-chart-3",
        description: "Scheduled review — strengthen long-term memory",
    },
    learning: {
        icon: BookOpen,
        color: "text-chart-2",
        description: "Still learning — guided hints available",
    },
    new: {
        icon: Sparkles,
        color: "text-chart-1",
        description: `Learn once, then ${PEDAGOGY.newWordSessionRepetitions} practice rounds`,
    },
};

const STAGE_ORDER: WordLearningStage[] = ["due", "review", "learning", "new"];

interface PracticeSessionOverviewProps {
    counts: SessionStageCounts;
    totalWords: number;
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
    const stages = STAGE_ORDER.filter((stage) => counts[stage] > 0);
    const hasNewWords = newWordCount > 0;
    const timeEstimate = formatSessionEstimate(exerciseCount, hasNewWords, counts);
    const handleStart = useCallback(() => onStart(), [onStart]);

    useEnterKeyAction(handleStart, true);

    const sessionTypeLabel = isReviewSession && !hasNewWords
        ? "Review session"
        : hasNewWords
          ? "Mixed session"
          : "Practice session";

    const sessionDescription = isReviewSession && !hasNewWords
        ? "Due words first. Hints stay off so you really remember."
        : hasNewWords
          ? "Due and learning words come first, then new words with guided intro and spaced rounds."
          : "Active recall across words you've seen before.";

    return (
        <section className="flex flex-col flex-1 min-h-0 animate-in fade-in duration-300 max-w-2xl mx-auto w-full">
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 mb-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
                            <Zap className="h-3.5 w-3.5" aria-hidden />
                            {sessionTypeLabel}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                            Ready to practice?
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
                            {sessionDescription}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" aria-hidden />
                            {timeEstimate}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {exerciseCount} exercise{exerciseCount === 1 ? "" : "s"}
                        </span>
                    </div>
                </div>

                {stages.length > 0 ? (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">
                            Session order
                        </p>
                        {stages.map((stage, index) => {
                            const config = STAGE_CONFIG[stage];
                            const Icon = config.icon;
                            const count = counts[stage];
                            return (
                                <div
                                    key={stage}
                                    className={cn(
                                        "flex items-center gap-3 rounded-xl border border-border/70 bg-muted/25 px-3 py-3",
                                        "dark:bg-muted/10",
                                    )}
                                >
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-background border border-border shrink-0">
                                        <span className="text-xs font-bold text-muted-foreground tabular-nums">
                                            {index + 1}
                                        </span>
                                    </div>
                                    <Icon className={cn("h-4 w-4 shrink-0", config.color)} aria-hidden />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-sm font-semibold">{stageLabel(stage)}</p>
                                            <span className="text-xs text-muted-foreground tabular-nums">
                                                ×{count}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {config.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">{totalWords} words ready</p>
                )}

                {hasNewWords && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/5 border border-primary/15 px-3 py-3">
                        <Layers className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">New words</span> get a
                            short intro (read + listen), then{" "}
                            {PEDAGOGY.newWordSessionRepetitions} interleaved rounds: recognition →
                            production → listening.
                        </p>
                    </div>
                )}
            </div>

            <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <Button
                    size="lg"
                    onClick={handleStart}
                    className="min-w-[220px] rounded-xl gap-2 gradient-brand text-white shadow-md shadow-primary/20"
                >
                    Begin session
                    <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
                <p className="text-xs text-muted-foreground">Press Enter to start</p>
            </div>
        </section>
    );
}
