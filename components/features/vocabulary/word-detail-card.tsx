"use client";

import { Button } from "@/components/ui/button";
import { AdaptiveText } from "@/components/common/adaptive-text";
import { LONG_TEXT_WRAP, SCROLLABLE_BODY } from "@/lib/long-text";
import { handleAudioPlayError } from "@/lib/audio-playback";
import { cn } from "@/lib/utils";
import { getPlayPhraseSearchUrl } from "@/lib/playphrase";
import { getWordExamples } from "@/lib/practice-utils";
import { IWord } from "@/types/courses/courses.type";
import { Film, Volume2 } from "lucide-react";
import Image from "next/image";

export type WordDetailCardWord = Pick<
    IWord,
    "word" | "meaning" | "pronunciation" | "partOfSpeech" | "audioUrl" | "imageUrl" | "example"
>;

export interface WordDetailCardProps {
    word: WordDetailCardWord;
    /** Layout: "horizontal" (image left, text right) or "stack" (image on top). */
    layout?: "horizontal" | "stack";
    /** Card style: "default" (neutral), "compact" (smaller). */
    variant?: "default" | "compact";
    /** When true, card fits in viewport; only examples section scrolls (like practice-result-dialog). */
    constrainHeight?: boolean;
    className?: string;
}

export default function WordDetailCard({
    word,
    layout = "horizontal",
    variant = "default",
    constrainHeight = false,
    className = "",
}: Readonly<WordDetailCardProps>) {
    const examples = getWordExamples(word);

    const handlePlayAudio = () => {
        if (word.audioUrl) {
            new Audio(word.audioUrl).play().catch(handleAudioPlayError);
        }
    };

    const isCompact = variant === "compact";
    const imageSize = isCompact ? "w-24 h-24 sm:w-28 sm:h-28" : "w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44";
    const stackImageClass = constrainHeight
        ? "shrink-0 overflow-hidden bg-muted w-full aspect-video max-h-[min(28dvh,200px)] sm:max-h-[min(32dvh,240px)]"
        : "shrink-0 overflow-hidden bg-muted w-full aspect-video sm:aspect-[2/1]";

    return (
        <div
            className={
                [
                    layout === "stack"
                        ? "rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
                        : "rounded-2xl border border-border bg-card/80 shadow-sm overflow-hidden",
                    constrainHeight && "min-h-0 flex flex-col h-full",
                    className,
                ]
                    .filter(Boolean)
                    .join(" ")
            }
        >
            <div
                className={
                    layout === "stack"
                        ? cn(
                              "flex flex-col",
                              constrainHeight && "flex-1 min-h-0",
                          )
                        : cn(
                              "flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch",
                              constrainHeight && "flex-1 min-h-0",
                          )
                }
            >
                {word.imageUrl && (
                    <div
                        className={
                            layout === "stack"
                                ? stackImageClass
                                : `shrink-0 overflow-hidden bg-muted ${imageSize} rounded-xl sm:rounded-l-2xl sm:rounded-r-none`
                        }
                    >
                        <Image
                            src={word.imageUrl}
                            alt={word.word}
                            width={layout === "stack" ? 560 : 176}
                            height={layout === "stack" ? 280 : 176}
                            className="w-full h-full object-contain"
                            unoptimized
                            loading="lazy"
                        />
                    </div>
                )}
                <div className={`flex-1 min-w-0 flex flex-col p-4 sm:p-5 md:p-6 ${constrainHeight ? "min-h-0 overflow-hidden" : ""}`}>
                    <div className="flex items-start justify-between gap-3 shrink-0">
                        <div className="min-w-0 flex-1">
                            <AdaptiveText
                                text={word.word}
                                role="word"
                                as="h2"
                                scrollWhenLong={false}
                                className={isCompact ? "!text-lg sm:!text-xl" : undefined}
                            />
                            {(word.partOfSpeech || word.pronunciation) && (
                                <p className={`mt-1 text-muted-foreground ${LONG_TEXT_WRAP} ${isCompact ? "text-xs" : "text-sm sm:text-base"}`}>
                                    {[word.partOfSpeech, word.pronunciation].filter(Boolean).join(" · ")}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                type="button"
                                variant="outline"
                                size={isCompact ? "icon" : "default"}
                                asChild
                                className="rounded-full"
                                aria-label="Watch movie clips with this word"
                            >
                                <a
                                    href={getPlayPhraseSearchUrl(word.word)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2"
                                >
                                    <Film className={isCompact ? "h-4 w-4" : "h-5 w-5 sm:mr-2"} />
                                    {!isCompact && <span className="hidden sm:inline">Watch clips</span>}
                                </a>
                            </Button>
                            {word.audioUrl && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size={isCompact ? "icon" : "default"}
                                    onClick={handlePlayAudio}
                                    className="shrink-0 rounded-full"
                                    aria-label="Play pronunciation"
                                >
                                    <Volume2 className={isCompact ? "h-4 w-4" : "h-5 w-5 sm:mr-2"} />
                                    {!isCompact && <span className="hidden sm:inline">Listen</span>}
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className={constrainHeight ? cn(SCROLLABLE_BODY, "mt-2 sm:mt-3") : "mt-2 sm:mt-3"}>
                        <AdaptiveText
                            text={word.meaning}
                            role="meaning"
                            className={`text-foreground/90 ${isCompact ? "!text-sm sm:!text-base" : ""}`}
                        />
                        {examples.length > 0 && (
                            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/60">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 shrink-0">
                                    Examples
                                </p>
                                <ul className="space-y-1.5">
                                    {examples.map((ex) => (
                                        <li key={ex}>
                                            <AdaptiveText
                                                text={`"${ex}"`}
                                                role="example"
                                                className={`text-foreground/90 italic ${isCompact ? "!text-xs sm:!text-sm" : ""}`}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
