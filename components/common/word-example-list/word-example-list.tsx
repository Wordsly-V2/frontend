"use client";

import { Button } from "@/components/ui/button";
import { getLongTextTitle, getTextDisplayClasses, LONG_TEXT_WRAP } from "@/lib/long-text";
import { playAudioUrl } from "@/lib/practice-audio";
import { splitAroundWord, splitHighlightMarkers } from "@/lib/practice-utils";
import { cn } from "@/lib/utils";
import type { IWordExample } from "@/types/courses/courses.type";
import { Volume2 } from "lucide-react";
import { Fragment } from "react";

/** Placeholder shown in place of the target word when it must stay hidden. */
const WORD_MASK = "****";

/**
 * How the target word appears inside the sentence:
 * - `word` — highlighted, so the learner sees it in context (result screens)
 * - `mask` — replaced by `****`, so the example stays a hint (in-exercise)
 * - `none` — plain sentence (detail screens, where the word is already the title)
 */
export type ExampleReveal = "word" | "mask" | "none";

export interface WordExampleListProps {
    examples: IWordExample[];
    /** The target word — used to locate the span to highlight or mask. */
    word: string;
    reveal?: ExampleReveal;
    /** Extra classes for the highlighted target word inside the sentence. */
    highlightClassName?: string;
    /** Side the play button sits on, relative to the sentence. */
    audioPosition?: "left" | "right";
    /** Cap the height of very long sentences instead of letting them clamp. */
    scrollWhenLong?: boolean;
    /** Wrap sentences in typographic quotes. */
    quoted?: boolean;
    textClassName?: string;
    translationClassName?: string;
    className?: string;
}

/** The target word inside a sentence, highlighted or masked per `reveal`. */
function ExampleText({
    text,
    word,
    reveal,
    highlightClassName,
}: Readonly<{
    text: string;
    word: string;
    reveal: ExampleReveal;
    highlightClassName?: string;
}>) {
    if (reveal === "none") return <>{text}</>;

    return (
        <>
            {splitAroundWord(text, word).map((segment, index) =>
                segment.match ? (
                    <span
                        key={`${index}-${segment.text}`}
                        className={cn(
                            "font-semibold not-italic",
                            reveal === "mask" && "tracking-widest text-muted-foreground",
                            highlightClassName,
                        )}
                        aria-label={reveal === "mask" ? "hidden word" : undefined}
                    >
                        {reveal === "mask" ? WORD_MASK : segment.text}
                    </span>
                ) : (
                    <Fragment key={`${index}-${segment.text}`}>{segment.text}</Fragment>
                ),
            )}
        </>
    );
}

/**
 * A translation with its `**…**` emphasis kept as emphasis. Langeek marks the
 * phrase matching the English target word, which tells the learner which idea
 * in their own language the word carries — showing raw asterisks wastes it.
 */
function ExampleTranslation({ text }: Readonly<{ text: string }>) {
    return (
        <>
            {splitHighlightMarkers(text).map((segment, index) =>
                segment.match ? (
                    <strong
                        key={`${index}-${segment.text}`}
                        className="font-semibold text-foreground/80"
                    >
                        {segment.text}
                    </strong>
                ) : (
                    <Fragment key={`${index}-${segment.text}`}>{segment.text}</Fragment>
                ),
            )}
        </>
    );
}

/**
 * The shared example-sentence list: sentence (with the target word highlighted,
 * masked, or plain), its translation, and its own audio. Used by the word detail
 * card, the in-exercise reveal hint, and the practice result panel so all three
 * show the learner the same thing.
 */
export function WordExampleList({
    examples,
    word,
    reveal = "word",
    highlightClassName,
    audioPosition = "right",
    scrollWhenLong = true,
    quoted = true,
    textClassName,
    translationClassName,
    className,
}: Readonly<WordExampleListProps>) {
    if (examples.length === 0) return null;

    return (
        <ul className={cn("space-y-2", className)}>
            {examples.map((example) => {
                const { sizeClass, scrollClass } = getTextDisplayClasses(
                    example.text,
                    "example",
                    scrollWhenLong,
                );
                const audioButton = example.audioUrl ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => playAudioUrl(example.audioUrl)}
                        className="h-7 w-7 shrink-0 rounded-full text-primary"
                        aria-label="Play example sentence"
                    >
                        <Volume2 className="h-4 w-4" />
                    </Button>
                ) : null;

                return (
                    <li key={example.id} className={LONG_TEXT_WRAP}>
                        <div className="flex items-start gap-1.5">
                            {audioPosition === "left" && audioButton}
                            <div className="min-w-0 flex-1">
                                <p
                                    className={cn(
                                        LONG_TEXT_WRAP,
                                        sizeClass,
                                        scrollClass,
                                        "italic",
                                        textClassName,
                                    )}
                                    title={getLongTextTitle(example.text)}
                                >
                                    {quoted && "“"}
                                    <ExampleText
                                        text={example.text}
                                        word={word}
                                        reveal={reveal}
                                        highlightClassName={highlightClassName}
                                    />
                                    {quoted && "”"}
                                </p>
                                {example.translation && (
                                    <p
                                        className={cn(
                                            "mt-0.5 text-xs sm:text-sm text-muted-foreground",
                                            LONG_TEXT_WRAP,
                                            translationClassName,
                                        )}
                                    >
                                        <ExampleTranslation text={example.translation} />
                                    </p>
                                )}
                            </div>
                            {audioPosition === "right" && audioButton}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
