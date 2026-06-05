"use client";

import { Button } from "@/components/ui/button";
import { dailyGoalProgress, type DailyHabitState } from "@/lib/daily-habit";
import { pickSessionCompleteMessage } from "@/lib/practice-feedback";
import { AnswerQuality } from "@/types/word-progress/word-progress.type";
import { IWord } from "@/types/courses/courses.type";
import { ArrowRight, Flame, RotateCcw, Sparkles, Target } from "lucide-react";

export interface SessionWordResult {
    wordId: string;
    quality: AnswerQuality;
}

export interface PracticeSessionSummaryProps {
    words: IWord[];
    wordResults: SessionWordResult[];
    score: number;
    habitState: DailyHabitState;
    onContinue: () => void;
    onRetryMissed?: () => void;
}

function isMissed(quality: AnswerQuality): boolean {
    return quality <= AnswerQuality.INCORRECT;
}

export function PracticeSessionSummary({
    words,
    wordResults,
    score,
    habitState,
    onContinue,
    onRetryMissed,
}: Readonly<PracticeSessionSummaryProps>) {
    const missedIds = new Set(
        wordResults.filter((r) => isMissed(r.quality)).map((r) => r.wordId),
    );
    const missedWords = words.filter((w) => missedIds.has(w.id));
    const strongCount = wordResults.filter((r) => r.quality >= AnswerQuality.CORRECT_WITH_HESITATION).length;
    const goal = dailyGoalProgress(habitState);
    const headline = pickSessionCompleteMessage(score, wordResults.length);

    return (
        <div className="animate-in fade-in zoom-in duration-500 text-center py-6 sm:py-10">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-4 sm:mb-6">
                <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold mb-2 gradient-brand bg-clip-text text-transparent">
                {headline}
            </h2>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                {wordResults.length} word{wordResults.length === 1 ? "" : "s"} practiced
            </p>

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
                    <span>{goal.met ? "Done for today!" : `${goal.goal - habitState.wordsToday} more to go`}</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-[var(--brand-accent)] transition-all duration-500"
                        style={{ width: `${goal.percent}%` }}
                    />
                </div>
            </div>

            {missedWords.length > 0 && (
                <div className="max-w-md mx-auto mb-6 rounded-xl border border-orange-200/80 bg-orange-50/80 dark:bg-orange-950/20 dark:border-orange-800/50 p-4 text-left">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                        Needs more practice ({missedWords.length})
                    </p>
                    <ul className="space-y-1 text-sm text-orange-700 dark:text-orange-300">
                        {missedWords.slice(0, 5).map((w) => (
                            <li key={w.id}>
                                <span className="font-medium">{w.word}</span>
                                <span className="text-orange-600/80 dark:text-orange-400/80"> — {w.meaning}</span>
                            </li>
                        ))}
                        {missedWords.length > 5 && (
                            <li className="text-xs text-muted-foreground">+{missedWords.length - 5} more</li>
                        )}
                    </ul>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {missedWords.length > 0 && onRetryMissed && (
                    <Button variant="outline" size="lg" onClick={onRetryMissed} className="gap-2 rounded-xl">
                        <RotateCcw className="h-4 w-4" aria-hidden />
                        Retry missed words
                    </Button>
                )}
                <Button size="lg" onClick={onContinue} className="gap-2 rounded-xl">
                    Continue
                    <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
            </div>
        </div>
    );
}
