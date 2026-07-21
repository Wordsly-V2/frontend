"use client";

import { AdaptiveText } from "@/components/common/adaptive-text";
import { Button } from "@/components/ui/button";
import { LONG_TEXT_WRAP } from "@/lib/long-text";
import { playAudioUrl } from "@/lib/practice-audio";
import { getWordExampleObjects, splitAroundWord } from "@/lib/practice-utils";
import { cn } from "@/lib/utils";
import type { IWord } from "@/types/courses/courses.type";
import { Eye, EyeOff, Volume2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";

/** Placeholder shown in place of the target word so the example stays a hint. */
const WORD_MASK = "****";

interface WordRevealHintProps {
    word: IWord;
    /**
     * Show the meaning when revealed. Turn off in exercises that already display
     * it (e.g. word bank) so the reveal only adds the example + image.
     */
    showMeaning?: boolean;
    /**
     * Fired the first time the learner reveals, so the engine can count it as a
     * used hint (which caps the answer quality). Only fires once per word.
     */
    onReveal?: () => void;
    className?: string;
}

/**
 * The single practice hint: an "I'm stuck" reveal that shows the word's meaning,
 * example sentence(s) — with the target word highlighted, plus translation and
 * audio when the data has them — and the image. Revealing counts as a hint, so
 * the engine lowers the recorded answer quality accordingly.
 */
export function WordRevealHint({
    word,
    showMeaning = true,
    onReveal,
    className,
}: Readonly<WordRevealHintProps>) {
    const [revealed, setRevealed] = useState(false);
    const revealedOnceRef = useRef(false);
    const examples = useMemo(() => getWordExampleObjects(word), [word]);
    const imageUrl = word.imageUrl?.trim();
    const hasContent = showMeaning || examples.length > 0 || Boolean(imageUrl);

    const toggleReveal = useCallback(() => {
        setRevealed((prev) => {
            const next = !prev;
            // Count as a used hint only the first time it's opened, so toggling it
            // shut and open again doesn't keep lowering the recorded quality.
            if (next && !revealedOnceRef.current) {
                revealedOnceRef.current = true;
                onReveal?.();
            }
            return next;
        });
    }, [onReveal]);

    if (!hasContent) return null;

    const showLabel = showMeaning ? "Show meaning & example" : "Show example";

    return (
        <div className={cn("w-full", className)}>
            <button
                type="button"
                onClick={toggleReveal}
                aria-expanded={revealed}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
            >
                {revealed ? (
                    <EyeOff className="h-3.5 w-3.5" aria-hidden />
                ) : (
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                )}
                {revealed ? "Hide hint" : showLabel}
            </button>

            {revealed && (
                <div className="mx-auto mt-3 w-full max-w-md space-y-3 rounded-2xl border border-border bg-muted/30 p-4 text-left animate-in fade-in slide-in-from-top-1 duration-200">
            {showMeaning && (
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                        Meaning
                    </p>
                    <AdaptiveText
                        text={word.meaning}
                        role="meaning"
                        className="!text-sm sm:!text-base text-foreground/90"
                        scrollWhenLong={false}
                    />
                </div>
            )}

            {examples.length > 0 && (
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                        Example
                    </p>
                    <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                        {examples.slice(0, 2).map((example) => (
                            <li key={example.id} className={LONG_TEXT_WRAP}>
                                <div className="flex items-start gap-1.5">
                                    <div className="min-w-0 flex-1">
                                        <p className="italic">
                                            &ldquo;
                                            {splitAroundWord(example.text, word.word).map(
                                                (seg, i) =>
                                                    seg.match ? (
                                                        // Keep the answer hidden — the
                                                        // example is a hint, not a giveaway.
                                                        <span
                                                            key={`${example.id}-${i}`}
                                                            className="font-semibold not-italic tracking-widest text-muted-foreground"
                                                            aria-label="hidden word"
                                                        >
                                                            {WORD_MASK}
                                                        </span>
                                                    ) : (
                                                        <span key={`${example.id}-${i}`}>
                                                            {seg.text}
                                                        </span>
                                                    ),
                                            )}
                                            &rdquo;
                                        </p>
                                        {example.translation && (
                                            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground/70">
                                                {example.translation}
                                            </p>
                                        )}
                                    </div>
                                    {example.audioUrl && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => playAudioUrl(example.audioUrl)}
                                            className="h-7 w-7 shrink-0 rounded-full text-muted-foreground"
                                            aria-label="Play example sentence"
                                        >
                                            <Volume2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {imageUrl && (
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                        Image
                    </p>
                    <div className="rounded-xl overflow-hidden bg-muted border border-border aspect-square max-h-40 w-40">
                        <Image
                            src={imageUrl}
                            alt=""
                            width={160}
                            height={160}
                            className="w-full h-full object-cover"
                            unoptimized
                        />
                    </div>
                </div>
            )}
                </div>
            )}
        </div>
    );
}
