"use client";

import { AdaptiveText } from "@/components/common/adaptive-text";
import { Button } from "@/components/ui/button";
import { LONG_TEXT_WRAP, SCROLLABLE_BODY } from "@/lib/long-text";
import { getPlayPhraseSearchUrl } from "@/lib/playphrase";
import { splitAroundWord } from "@/lib/practice-utils";
import { pickCorrectMessage, pickIncorrectMessage } from "@/lib/practice-feedback";
import { playAudioUrl } from "@/lib/practice-audio";
import { cn } from "@/lib/utils";
import { CheckCircle2, Film, Timer, Volume2, XCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

export interface PracticeResultPanelProps {
    isCorrect: boolean;
    /** Correct despite a small typo/accent slip — shown as "Almost, close enough!". */
    isNear?: boolean;
    userAnswer: string;
    correctAnswer: string;
    meaning: string;
    pronunciation?: string;
    partOfSpeech?: string;
    audioUrl?: string;
    imageUrl?: string;
    examples?: string[];
    timeSpentSeconds?: number;
    onNext: () => void;
    isLastWord: boolean;
    feedbackSeed?: number;
    className?: string;
}

/** Inline answer feedback — keeps the learner in the exercise card instead of a modal. */
export function PracticeResultPanel({
    isCorrect,
    isNear = false,
    userAnswer,
    correctAnswer,
    meaning,
    pronunciation,
    partOfSpeech,
    audioUrl,
    imageUrl,
    examples = [],
    timeSpentSeconds,
    onNext,
    isLastWord,
    feedbackSeed = 0,
    className,
}: Readonly<PracticeResultPanelProps>) {
    const mountedAtRef = useRef(0);
    const nextButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        mountedAtRef.current = Date.now();
        // Move focus to the primary action so keyboard/SR users land on "Continue".
        nextButtonRef.current?.focus();
        if (audioUrl) {
            const timer = setTimeout(() => playAudioUrl(audioUrl), 300);
            return () => clearTimeout(timer);
        }
    }, [audioUrl]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Enter") return;
            if (Date.now() - mountedAtRef.current < 150) return;
            e.preventDefault();
            onNext();
        };
        globalThis.addEventListener("keydown", handleKeyDown, true);
        return () => globalThis.removeEventListener("keydown", handleKeyDown, true);
    }, [onNext]);

    let speedLabel: string | null = null;
    if (timeSpentSeconds != null && timeSpentSeconds > 0) {
        speedLabel =
            timeSpentSeconds < 60
                ? `${Math.round(timeSpentSeconds)}s`
                : `${(60 / timeSpentSeconds).toFixed(1)}/min`;
    }

    let continueLabel = "Continue";
    if (isCorrect && isLastWord) {
        continueLabel = "Finish session";
    }

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                "animate-in fade-in slide-in-from-bottom-2 duration-300 text-center",
                className,
            )}
        >
            <div className="mb-4">
                {isCorrect && isNear ? (
                    <div className="space-y-2">
                        <div className="animate-pop inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 ring-4 ring-amber-400/20">
                            <CheckCircle2 className="h-7 w-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400">
                            Almost — close enough! ✓
                        </h3>
                        {userAnswer && (
                            <p className="text-sm text-muted-foreground">
                                You wrote <span className="font-medium">{userAnswer}</span> — mind the spelling.
                            </p>
                        )}
                    </div>
                ) : isCorrect ? (
                    <div className="space-y-2">
                        <div className="animate-pop inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 ring-4 ring-[var(--brand-success)]/20">
                            <CheckCircle2 className="h-7 w-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-green-600 dark:text-green-400">
                            {pickCorrectMessage(feedbackSeed)}
                        </h3>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="animate-pop inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-red-400 to-rose-500 ring-4 ring-destructive/20">
                            <XCircle className="h-7 w-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
                            {pickIncorrectMessage(feedbackSeed)}
                        </h3>
                        {userAnswer && (
                            <p className={`text-sm text-muted-foreground line-through ${LONG_TEXT_WRAP}`}>
                                You wrote: {userAnswer}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            You&apos;ll see this word again before the session ends.
                        </p>
                    </div>
                )}
                {speedLabel && (
                    <p className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Timer className="h-3.5 w-3.5" aria-hidden />
                        {speedLabel}
                    </p>
                )}
            </div>

            <div
                className={cn(
                    "rounded-xl border-2 px-3 py-3 sm:px-4 text-left mb-5",
                    isCorrect
                        ? "bg-green-50/80 border-green-200 dark:bg-green-950/20 dark:border-green-800/50"
                        : "bg-red-50/80 border-red-200 dark:bg-red-950/20 dark:border-red-800/50",
                )}
            >
                <div className={cn("space-y-2.5 min-h-0", SCROLLABLE_BODY)}>
                    <div className="flex items-start gap-3">
                        {imageUrl && (
                            <div className="shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted border border-border">
                                <Image
                                    src={imageUrl}
                                    alt=""
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                />
                            </div>
                        )}
                        <div className="min-w-0 flex-1 flex items-start justify-between gap-2">
                            <AdaptiveText
                                text={correctAnswer}
                                role="word"
                                as="p"
                                scrollWhenLong={false}
                                className={cn(
                                    "!text-lg sm:!text-xl font-semibold",
                                    isCorrect
                                        ? "text-green-900 dark:text-green-100"
                                        : "text-red-900 dark:text-red-100",
                                )}
                            />
                            <div className="flex items-center gap-0.5 shrink-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    asChild
                                    className="h-8 w-8 rounded-full"
                                    aria-label="Watch movie clips"
                                >
                                    <a
                                        href={getPlayPhraseSearchUrl(correctAnswer)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Film className="h-4 w-4" />
                                    </a>
                                </Button>
                                {audioUrl && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => playAudioUrl(audioUrl)}
                                        className="h-8 w-8 rounded-full"
                                        aria-label="Play pronunciation"
                                    >
                                        <Volume2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <p
                        className={cn(
                            "text-sm sm:text-base leading-relaxed break-words min-w-0 w-full",
                            isCorrect
                                ? "text-green-700 dark:text-green-300"
                                : "text-red-700 dark:text-red-300",
                        )}
                    >
                        {meaning}
                    </p>

                    {(partOfSpeech || pronunciation) && (
                        <p
                            className={cn(
                                "text-xs",
                                LONG_TEXT_WRAP,
                                isCorrect ? "text-green-600/80" : "text-red-600/80",
                            )}
                        >
                            {[partOfSpeech, pronunciation].filter(Boolean).join(" · ")}
                        </p>
                    )}
                </div>
                {examples.length > 0 && (
                    <div
                        className={cn(
                            "mt-3 pt-3 border-t",
                            isCorrect ? "border-green-200/60" : "border-red-200/60",
                        )}
                    >
                        <p className="text-xs font-medium mb-1 text-muted-foreground">Examples</p>
                        <ul className="space-y-1">
                            {examples.slice(0, 2).map((ex) => (
                                <li
                                    key={ex}
                                    className={cn("text-xs italic text-muted-foreground", LONG_TEXT_WRAP)}
                                >
                                    &ldquo;
                                    {splitAroundWord(ex, correctAnswer).map((seg, i) =>
                                        seg.match ? (
                                            <span
                                                key={`${ex}-${i}`}
                                                className={cn(
                                                    "font-semibold not-italic",
                                                    isCorrect
                                                        ? "text-green-700 dark:text-green-300"
                                                        : "text-red-700 dark:text-red-300",
                                                )}
                                            >
                                                {seg.text}
                                            </span>
                                        ) : (
                                            <span key={`${ex}-${i}`}>{seg.text}</span>
                                        ),
                                    )}
                                    &rdquo;
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <Button
                    ref={nextButtonRef}
                    type="button"
                    variant="play"
                    size="lg"
                    onClick={onNext}
                    className="flex-1"
                >
                    {continueLabel}
                    <span className="ml-1.5 text-xs opacity-70 font-normal">Enter</span>
                </Button>
            </div>
        </div>
    );
}
