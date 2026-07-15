"use client";

import { Button } from "@/components/ui/button";
import { AdaptiveText } from "@/components/common/adaptive-text";
import { WordPill } from "@/components/common/word-pill";
import { LONG_TEXT_WRAP } from "@/lib/long-text";
import { handleAudioPlayError } from "@/lib/audio-playback";
import { cn } from "@/lib/utils";
import { getPlayPhraseSearchUrl } from "@/lib/playphrase";
import { getWordExampleObjects } from "@/lib/practice-utils";
import { IWord } from "@/types/courses/courses.type";
import { Film, Volume2 } from "lucide-react";
import Image from "next/image";

export type WordDetailCardWord = Pick<
    IWord,
    | "word"
    | "meaning"
    | "pronunciation"
    | "partOfSpeech"
    | "audioUrl"
    | "imageUrl"
    | "example"
    | "ukAudioUrl"
    | "usAudioUrl"
    | "ukIpa"
    | "usIpa"
    | "imageThumbnailUrl"
    | "wordForms"
    | "examples"
>;

export interface WordDetailCardProps {
    word: WordDetailCardWord;
    /** Layout: "horizontal" (image left, text right) or "stack" (image on top). */
    layout?: "horizontal" | "stack";
    /** Card style: "default" (neutral), "compact" (smaller). */
    variant?: "default" | "compact";
    /** When true, card fits in viewport; the whole card body scrolls. */
    constrainHeight?: boolean;
    className?: string;
}

function playAudio(url?: string) {
    if (!url) return;
    new Audio(url).play().catch(handleAudioPlayError);
}

/** UK | US segmented pronunciation control (accent label + IPA + audio). */
function PronunciationControl({
    ukAudioUrl,
    usAudioUrl,
    ukIpa,
    usIpa,
    isCompact,
}: Readonly<{
    ukAudioUrl?: string;
    usAudioUrl?: string;
    ukIpa?: string;
    usIpa?: string;
    isCompact: boolean;
}>) {
    const accents = [
        { label: "UK", audioUrl: ukAudioUrl, ipa: ukIpa },
        { label: "US", audioUrl: usAudioUrl, ipa: usIpa },
    ].filter((a) => a.audioUrl);

    if (accents.length === 0) return null;

    return (
        <div className="inline-flex items-stretch overflow-hidden rounded-full border border-border">
            {accents.map((accent, idx) => (
                <button
                    key={accent.label}
                    type="button"
                    onClick={() => playAudio(accent.audioUrl)}
                    aria-label={`Play ${accent.label} pronunciation`}
                    className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors hover:bg-muted focus:bg-muted focus:outline-none",
                        idx > 0 && "border-l border-border",
                    )}
                >
                    <Volume2 className="h-4 w-4 shrink-0 text-primary" />
                    <span className="font-semibold">{accent.label}</span>
                    {!isCompact && accent.ipa && (
                        <span className="text-muted-foreground">{accent.ipa}</span>
                    )}
                </button>
            ))}
        </div>
    );
}

export default function WordDetailCard({
    word,
    layout = "horizontal",
    variant = "default",
    constrainHeight = false,
    className = "",
}: Readonly<WordDetailCardProps>) {
    const examples = getWordExampleObjects(word);
    const isCompact = variant === "compact";
    const hasAccentAudio = Boolean(word.ukAudioUrl || word.usAudioUrl);
    // Compact layouts prefer the smaller thumbnail when available.
    const displayImageUrl = isCompact
        ? word.imageThumbnailUrl || word.imageUrl
        : word.imageUrl;

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
                              constrainHeight && "flex-1 min-h-0 overflow-y-auto overscroll-contain",
                          )
                        : cn(
                              "flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch",
                              constrainHeight && "flex-1 min-h-0 overflow-y-auto overscroll-contain",
                          )
                }
            >
                {displayImageUrl && (
                    <div
                        className={
                            layout === "stack"
                                ? stackImageClass
                                : `shrink-0 overflow-hidden bg-muted ${imageSize} rounded-xl sm:rounded-l-2xl sm:rounded-r-none`
                        }
                    >
                        <Image
                            src={displayImageUrl}
                            alt={word.word}
                            width={layout === "stack" ? 560 : 176}
                            height={layout === "stack" ? 280 : 176}
                            className="w-full h-full object-contain"
                            unoptimized
                            loading="lazy"
                        />
                    </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col p-4 sm:p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3 shrink-0">
                        <div className="min-w-0 flex-1">
                            <AdaptiveText
                                text={word.word}
                                role="word"
                                as="h2"
                                scrollWhenLong={false}
                                className={isCompact ? "!text-lg sm:!text-xl" : undefined}
                            />
                            {(word.partOfSpeech || (word.pronunciation && !hasAccentAudio)) && (
                                <p className={`mt-1 text-muted-foreground ${LONG_TEXT_WRAP} ${isCompact ? "text-xs" : "text-sm sm:text-base"}`}>
                                    {[word.partOfSpeech, !hasAccentAudio ? word.pronunciation : undefined]
                                        .filter(Boolean)
                                        .join(" · ")}
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
                            {/* Accent audio → UK|US control; otherwise single Listen button. */}
                            {hasAccentAudio ? (
                                <PronunciationControl
                                    ukAudioUrl={word.ukAudioUrl}
                                    usAudioUrl={word.usAudioUrl}
                                    ukIpa={word.ukIpa}
                                    usIpa={word.usIpa}
                                    isCompact={isCompact}
                                />
                            ) : (
                                word.audioUrl && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size={isCompact ? "icon" : "default"}
                                        onClick={() => playAudio(word.audioUrl)}
                                        className="shrink-0 rounded-full"
                                        aria-label="Play pronunciation"
                                    >
                                        <Volume2 className={isCompact ? "h-4 w-4" : "h-5 w-5 sm:mr-2"} />
                                        {!isCompact && <span className="hidden sm:inline">Listen</span>}
                                    </Button>
                                )
                            )}
                        </div>
                    </div>
                    {word.wordForms && word.wordForms.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 shrink-0">
                            {word.wordForms.map((form) => (
                                <WordPill key={form} size="sm">
                                    {form}
                                </WordPill>
                            ))}
                        </div>
                    )}
                    <div className="mt-2 sm:mt-3">
                        <AdaptiveText
                            text={word.meaning}
                            role="meaning"
                            scrollWhenLong={!constrainHeight}
                            className={`text-foreground/90 ${isCompact ? "!text-sm sm:!text-base" : ""}`}
                        />
                        {examples.length > 0 && (
                            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/60">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 shrink-0">
                                    Examples
                                </p>
                                <ul className="space-y-2">
                                    {examples.map((ex) => (
                                        <li key={ex.id}>
                                            <div className="flex items-start gap-2">
                                                {ex.audioUrl && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => playAudio(ex.audioUrl)}
                                                        className="h-7 w-7 shrink-0 rounded-full text-primary"
                                                        aria-label="Play example audio"
                                                    >
                                                        <Volume2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <AdaptiveText
                                                        text={`"${ex.text}"`}
                                                        role="example"
                                                        scrollWhenLong={!constrainHeight}
                                                        className={`text-foreground/90 italic ${isCompact ? "!text-xs sm:!text-sm" : ""}`}
                                                    />
                                                    {ex.translation && (
                                                        <p className={`mt-0.5 text-muted-foreground ${isCompact ? "text-xs" : "text-xs sm:text-sm"}`}>
                                                            {ex.translation}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
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
