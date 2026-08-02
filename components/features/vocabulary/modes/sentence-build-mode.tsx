"use client";

import { AdaptiveText } from "@/components/common/adaptive-text";
import { Button } from "@/components/ui/button";
import { splitHighlightMarkers, type SentenceBuildPrompt } from "@/lib/practice-utils";
import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import { memo, Fragment } from "react";

/**
 * Tiles the learner hasn't used yet, as indices into `tiles`.
 *
 * Positions are indices rather than strings because a sentence can repeat a
 * word ("the", "to") and each copy has to be placeable independently. The
 * engine shares this helper so the number-key shortcuts land on the same tile
 * the learner sees numbered on screen.
 */
export function remainingTileIndices(
    tiles: string[],
    placed: number[],
): number[] {
    const used = new Set(placed);
    return tiles.map((_, index) => index).filter((index) => !used.has(index));
}

/** Assemble the English sentence from shuffled tiles, cued by its translation. */
export interface SentenceBuildModeProps {
    prompt: SentenceBuildPrompt;
    /** Tile indices already in the answer tray, in the order placed. */
    placed: number[];
    onPlace: (tileIndex: number) => void;
    onRemoveAt: (position: number) => void;
    onHint: () => void;
    hintsUsed: number;
    autoCheck: boolean;
    onCheck: () => void;
}

export const SentenceBuildMode = memo(function SentenceBuildMode({
    prompt,
    placed,
    onPlace,
    onRemoveAt,
    onHint,
    hintsUsed,
    autoCheck,
    onCheck,
}: Readonly<SentenceBuildModeProps>) {
    const remaining = remainingTileIndices(prompt.tiles, placed);
    const isComplete = placed.length === prompt.tokens.length;

    return (
        <div className="space-y-5">
            <div className="text-center">
                <AdaptiveText
                    text={prompt.translation}
                    role="sentence"
                    align="center"
                    className="sr-only"
                />
                <p
                    aria-hidden="true"
                    className="px-2 mb-1 text-lg sm:text-xl leading-relaxed text-foreground/90"
                >
                    {splitHighlightMarkers(prompt.translation).map((segment, index) => (
                        <Fragment key={`${segment.text}-${index}`}>
                            {segment.match ? (
                                <strong className="font-semibold text-primary">
                                    {segment.text}
                                </strong>
                            ) : (
                                segment.text
                            )}
                        </Fragment>
                    ))}
                </p>
                <p className="text-xs text-muted-foreground">
                    Put the English words in order
                </p>
            </div>

            {/* Answer tray — tap a word to send it back down. */}
            <div
                className={cn(
                    "min-h-[72px] rounded-2xl border-2 border-dashed p-3",
                    "flex flex-wrap content-start items-start justify-center gap-2",
                    isComplete ? "border-primary/60 bg-primary/5" : "border-border/70",
                )}
            >
                {placed.length === 0 ? (
                    <span className="self-center text-sm text-muted-foreground">
                        Tap the words below to start
                    </span>
                ) : (
                    placed.map((tileIndex, position) => (
                        <Button
                            key={`${tileIndex}-${position}`}
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => onRemoveAt(position)}
                            className="h-auto rounded-xl px-3 py-1.5 text-base font-medium shadow-pressable"
                        >
                            {prompt.tiles[tileIndex]}
                        </Button>
                    ))
                )}
            </div>

            {/* Word bank — numbered to match the 1–9 keyboard shortcuts. */}
            <div className="flex flex-wrap items-center justify-center gap-2">
                {remaining.map((tileIndex, position) => (
                    <Button
                        key={tileIndex}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onPlace(tileIndex)}
                        className="h-auto gap-1.5 rounded-xl px-3 py-1.5 text-base font-medium"
                    >
                        {position < 9 && (
                            <span className="hidden md:inline text-[10px] font-mono text-muted-foreground">
                                {position + 1}
                            </span>
                        )}
                        {prompt.tiles[tileIndex]}
                    </Button>
                ))}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
                <Button
                    variant="outline"
                    onClick={onHint}
                    disabled={isComplete}
                    className="gap-2 rounded-xl"
                >
                    <Lightbulb className="h-4 w-4" />
                    Hint {hintsUsed > 0 ? `(${hintsUsed})` : ""}
                </Button>
                {!autoCheck && (
                    <Button
                        onClick={onCheck}
                        disabled={placed.length === 0}
                        className="rounded-xl"
                    >
                        Check
                    </Button>
                )}
            </div>
        </div>
    );
});
