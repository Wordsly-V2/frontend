"use client";

import { AdaptiveText } from "@/components/common/adaptive-text";
import { Button } from "@/components/ui/button";
import { LONG_TEXT_WRAP, SCROLLABLE_BODY } from "@/lib/long-text";
import { getPlayPhraseSearchUrl } from "@/lib/playphrase";
import { pickCorrectMessage, pickIncorrectMessage } from "@/lib/practice-feedback";
import { playAudioUrl } from "@/lib/practice-audio";
import { cn } from "@/lib/utils";
import { CheckCircle2, Film, Timer, Volume2, XCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

export interface PracticeResultPanelProps {
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
    meaning: string;
    pronunciation?: string;
    partOfSpeech?: string;
    audioUrl?: string;
    imageUrl?: string;
    examples?: string[];
    timeSpentSeconds?: number;
    onTryAgain: () => void;
    onNext: () => void;
    isLastWord: boolean;
    feedbackSeed?: number;
    className?: string;
}

/** Inline answer feedback — keeps the learner in the exercise card instead of a modal. */
export function PracticeResultPanel({
    isCorrect,
    userAnswer,
    correctAnswer,
    meaning,
    pronunciation,
    partOfSpeech,
    audioUrl,
    imageUrl,
    examples = [],
    timeSpentSeconds,
    onTryAgain,
    onNext,
    isLastWord,
    feedbackSeed = 0,
    className,
}: Readonly<PracticeResultPanelProps>) {
    const mountedAtRef = useRef(0);

    useEffect(() => {
        mountedAtRef.current = Date.now();
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

    return (
        <div
            className={cn(
                "animate-in fade-in slide-in-from-bottom-2 duration-300 text-center",
                className,
            )}
        >
            <div className="mb-4">
                {isCorrect ? (
                    <div className="space-y-2">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500">
                            <CheckCircle2 className="h-7 w-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-green-600 dark:text-green-400">
                            {pickCorrectMessage(feedbackSeed)}
                        </h3>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-red-400 to-rose-500">
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
                    "rounded-xl border-2 px-4 py-3 text-left mb-5",
                    isCorrect
                        ? "bg-green-50/80 border-green-200 dark:bg-green-950/20 dark:border-green-800/50"
                        : "bg-red-50/80 border-red-200 dark:bg-red-950/20 dark:border-red-800/50",
                )}
            >
                <div className={`flex gap-3 items-start min-h-0 ${SCROLLABLE_BODY}`}>
                    {imageUrl && (
                        <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-muted border border-border">
                            <Image
                                src={imageUrl}
                                alt=""
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                                unoptimized
                            />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <AdaptiveText
                                    text={correctAnswer}
                                    role="word"
                                    as="p"
                                    scrollWhenLong={false}
                                    className={cn(
                                        "!text-lg font-semibold",
                                        isCorrect ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100",
                                    )}
                                />
                                <AdaptiveText
                                    text={meaning}
                                    role="meaning"
                                    className={cn(
                                        "mt-0.5",
                                        isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300",
                                    )}
                                />
                                {(partOfSpeech || pronunciation) && (
                                    <p
                                        className={cn(
                                            "text-xs mt-1",
                                            LONG_TEXT_WRAP,
                                            isCorrect ? "text-green-600/80" : "text-red-600/80",
                                        )}
                                    >
                                        {[partOfSpeech, pronunciation].filter(Boolean).join(" · ")}
                                    </p>
                                )}
                            </div>
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
                                <li key={ex}>
                                    <AdaptiveText
                                        text={`"${ex}"`}
                                        role="example"
                                        className="text-xs italic text-muted-foreground"
                                        scrollWhenLong={false}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                {!isCorrect && (
                    <Button type="button" variant="outline" onClick={onTryAgain} className="flex-1 rounded-xl">
                        Try again
                    </Button>
                )}
                <Button type="button" onClick={onNext} className="flex-1 rounded-xl">
                    {isLastWord ? "Finish session" : "Continue"}
                    <span className="ml-1.5 text-xs opacity-70 font-normal">Enter</span>
                </Button>
            </div>
        </div>
    );
}
