"use client";

import { Button } from "@/components/ui/button";
import { dailyGoalProgress } from "@/lib/daily-habit";
import { pickSessionCompleteMessage } from "@/lib/practice-feedback";
import type { IDailyHabit } from "@/types/daily-habit/daily-habit.type";
import { AnswerQuality } from "@/types/word-progress/word-progress.type";
import { useEnterKeyAction } from "@/lib/keyboard-utils";
import type { WordResult } from "@/types/practice/practice.type";
import { ArrowRight, Award, Flame, Sparkles, Target } from "lucide-react";
import { useCallback } from "react";

export type SessionWordResult = WordResult;

export interface PracticeSessionSummaryProps {
    wordResults: SessionWordResult[];
    score: number;
    habitState: IDailyHabit;
    onContinue: () => void;
}

export function PracticeSessionSummary({
    wordResults,
    score,
    habitState,
    onContinue,
}: Readonly<PracticeSessionSummaryProps>) {
    const strongCount = wordResults.filter((r) => r.quality >= AnswerQuality.CORRECT_WITH_HESITATION).length;
    const goal = dailyGoalProgress(habitState.wordsToday, habitState.goal);
    const headline = pickSessionCompleteMessage(score, wordResults.length);
    const handleContinue = useCallback(() => onContinue(), [onContinue]);

    useEnterKeyAction(handleContinue, true);

    return (
        <div className="animate-in fade-in duration-500 text-center py-4 sm:py-8 max-w-lg mx-auto w-full">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl gradient-brand mb-4 sm:mb-5 shadow-lg shadow-primary/20">
                <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold mb-2 gradient-brand bg-clip-text text-transparent">
                {headline}
            </h2>
            <p className="text-muted-foreground mb-2 text-sm sm:text-base">
                {wordResults.length} word{wordResults.length === 1 ? "" : "s"} practiced
            </p>
            {habitState.goalMetToday && (
                <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
                    <Award className="h-4 w-4" aria-hidden />
                    Daily goal complete
                    {habitState.goalStreak > 1 && ` · ${habitState.goalStreak}-day goal streak`}
                </p>
            )}
            {!habitState.goalMetToday && habitState.wordsToday > 0 && (
                <p className="text-sm text-muted-foreground mb-4">
                    {goal.remaining} more word{goal.remaining === 1 ? "" : "s"} to hit today&apos;s goal
                </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto mb-6 sm:mb-8">
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground mb-1">Score</p>
                    <p className="text-2xl font-bold text-primary">{score}%</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground mb-1">Strong</p>
                    <p className="text-2xl font-bold text-foreground">{strongCount}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                        <Flame className="h-3 w-3" aria-hidden />
                        Streak
                    </p>
                    <p className="text-2xl font-bold text-foreground">{habitState.streak}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                        <Target className="h-3 w-3" aria-hidden />
                        Today
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                        {habitState.wordsToday}/{goal.goal}
                    </p>
                </div>
            </div>

            <div className="max-w-md mx-auto mb-6 sm:mb-8 text-left">
                <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-2">
                    <span>Daily goal</span>
                    <span>{goal.met ? "Done for today!" : `${goal.remaining} more to go`}</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-[var(--brand-accent)] transition-all duration-500"
                        style={{ width: `${goal.percent}%` }}
                    />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" onClick={onContinue} className="gap-2 rounded-xl gradient-brand text-white shadow-md">
                    Continue
                    <ArrowRight className="h-4 w-4" aria-hidden />
                    <span className="text-xs opacity-80 font-normal">(Enter)</span>
                </Button>
            </div>
        </div>
    );
}
