"use client";

import { AdaptiveText } from "@/components/common/adaptive-text";
import { WordExampleList } from "@/components/common/word-example-list";
import { Button } from "@/components/ui/button";
import { LONG_TEXT_WRAP, SCROLLABLE_BODY } from "@/lib/long-text";
import { getPlayPhraseSearchUrl } from "@/lib/playphrase";
import { splitAroundWord, splitHighlightMarkers } from "@/lib/practice-utils";
import { pickCorrectMessage, pickIncorrectMessage } from "@/lib/practice-feedback";
import { playAudioSequence, playAudioUrl } from "@/lib/practice-audio";
import { cn } from "@/lib/utils";
import type { IWordExample } from "@/types/courses/courses.type";
import { CheckCircle2, Film, Timer, Volume2, XCircle } from "lucide-react";
import Image from "next/image";
import { Fragment, useEffect, useRef } from "react";

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
    /** Every example of the word — shown in full, like the word detail screen. */
    examples?: IWordExample[];
    /**
     * The example the exercise was built from (sentence modes only). Shown on its
     * own above the word so the learner can review the sentence they just worked
     * on: the full sentence, its meaning, its audio, and the word being practiced.
     */
    practicedExample?: IWordExample;
    /**
     * The word being practiced. Separate from `correctAnswer` because in
     * sentence-build the correct answer is the whole sentence.
     */
    practicedWord?: string;
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
    practicedExample,
    practicedWord,
    timeSpentSeconds,
    onNext,
    isLastWord,
    feedbackSeed = 0,
    className,
}: Readonly<PracticeResultPanelProps>) {
    const mountedAtRef = useRef(0);
    const nextButtonRef = useRef<HTMLButtonElement>(null);

    // The word to highlight inside sentences — falls back to the correct answer
    // for the modes where the answer *is* the word.
    const targetWord = practicedWord ?? correctAnswer;
    const practicedAudioUrl = practicedExample?.audioUrl;
    // The practiced sentence is already shown in full above, so don't repeat it.
    const otherExamples = practicedExample
        ? examples.filter((example) => example.id !== practicedExample.id)
        : examples;

    useEffect(() => {
        mountedAtRef.current = Date.now();
        // Move focus to the primary action so keyboard/SR users land on "Continue".
        nextButtonRef.current?.focus();
        if (!audioUrl && !practicedAudioUrl) return;

        let cancelSequence: (() => void) | null = null;
        // Pronunciation first, then the sentence it was practiced in.
        const timer = setTimeout(() => {
            cancelSequence = playAudioSequence([audioUrl, practicedAudioUrl]);
        }, 300);
        return () => {
            clearTimeout(timer);
            // Moving on mid-playback must not bleed audio into the next word.
            cancelSequence?.();
        };
    }, [audioUrl, practicedAudioUrl]);

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

    const toneText = isCorrect
        ? "text-green-700 dark:text-green-300"
        : "text-red-700 dark:text-red-300";
    const toneBorder = isCorrect ? "border-green-200/60" : "border-red-200/60";

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                "animate-in fade-in slide-in-from-bottom-2 duration-300 text-center",
                "flex flex-1 flex-col min-h-0",
                className,
            )}
        >
            <div className="mb-4 shrink-0">
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

            {/* Everything below scrolls, so "Continue" always stays reachable. */}
            <div className={cn("text-left space-y-3", SCROLLABLE_BODY)}>
                {practicedExample && (
                    <PracticedSentence
                        example={practicedExample}
                        word={targetWord}
                        pronunciation={pronunciation}
                        partOfSpeech={partOfSpeech}
                        wordAudioUrl={audioUrl}
                        isCorrect={isCorrect}
                    />
                )}

                <div
                    className={cn(
                        "rounded-xl border-2 px-3 py-3 sm:px-4",
                        isCorrect
                            ? "bg-green-50/80 border-green-200 dark:bg-green-950/20 dark:border-green-800/50"
                            : "bg-red-50/80 border-red-200 dark:bg-red-950/20 dark:border-red-800/50",
                    )}
                >
                    <div className="space-y-2.5">
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
                                            href={getPlayPhraseSearchUrl(targetWord)}
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
                                toneText,
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

                    {otherExamples.length > 0 && (
                        <div className={cn("mt-3 pt-3 border-t", toneBorder)}>
                            <p className="text-xs font-medium mb-1 text-muted-foreground">
                                {practicedExample ? "More examples" : "Examples"}
                            </p>
                            <WordExampleList
                                examples={otherExamples}
                                word={targetWord}
                                reveal="word"
                                highlightClassName={toneText}
                                scrollWhenLong={false}
                                textClassName="!text-xs sm:!text-sm text-muted-foreground"
                                translationClassName="text-xs"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-2 pt-4 shrink-0">
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

/**
 * The sentence the learner just worked on, in full: the English sentence with the
 * practiced word highlighted, its meaning, its audio, and which word was being
 * practiced. Sentence exercises hide or scramble all of that, so after answering
 * this is what turns the attempt back into something learnable.
 */
function PracticedSentence({
    example,
    word,
    pronunciation,
    partOfSpeech,
    wordAudioUrl,
    isCorrect,
}: Readonly<{
    example: IWordExample;
    word: string;
    pronunciation?: string;
    partOfSpeech?: string;
    wordAudioUrl?: string;
    isCorrect: boolean;
}>) {
    const meta = [partOfSpeech, pronunciation].filter(Boolean).join(" · ");

    return (
        <div className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-3 sm:px-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
                The sentence you practiced
            </p>

            <div className="flex items-start gap-1.5">
                <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base leading-relaxed italic text-foreground/90">
                        &ldquo;
                        {splitAroundWord(example.text, word).map((segment, index) =>
                            segment.match ? (
                                <span
                                    key={`${index}-${segment.text}`}
                                    className={cn(
                                        "font-semibold not-italic",
                                        isCorrect
                                            ? "text-green-700 dark:text-green-300"
                                            : "text-red-700 dark:text-red-300",
                                    )}
                                >
                                    {segment.text}
                                </span>
                            ) : (
                                <Fragment key={`${index}-${segment.text}`}>
                                    {segment.text}
                                </Fragment>
                            ),
                        )}
                        &rdquo;
                    </p>
                    {example.translation && (
                        <p className={cn("mt-1 text-xs sm:text-sm text-muted-foreground", LONG_TEXT_WRAP)}>
                            {splitHighlightMarkers(example.translation).map((segment, index) =>
                                segment.match ? (
                                    <strong
                                        key={`${index}-${segment.text}`}
                                        className="font-semibold text-foreground/80"
                                    >
                                        {segment.text}
                                    </strong>
                                ) : (
                                    <Fragment key={`${index}-${segment.text}`}>
                                        {segment.text}
                                    </Fragment>
                                ),
                            )}
                        </p>
                    )}
                </div>
                {example.audioUrl && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => playAudioUrl(example.audioUrl)}
                        className="h-8 w-8 shrink-0 rounded-full text-primary"
                        aria-label="Play this sentence"
                    >
                        <Volume2 className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="mt-2 flex items-center gap-1.5 border-t border-primary/15 pt-2">
                <p className={cn("min-w-0 flex-1 text-xs text-muted-foreground", LONG_TEXT_WRAP)}>
                    Word practiced:{" "}
                    <span className="font-semibold text-foreground">{word}</span>
                    {meta && <span> · {meta}</span>}
                </p>
                {wordAudioUrl && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => playAudioUrl(wordAudioUrl)}
                        className="h-7 w-7 shrink-0 rounded-full text-primary"
                        aria-label="Play pronunciation"
                    >
                        <Volume2 className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
