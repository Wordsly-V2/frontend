"use client";

import WordProgressBadge from "@/components/common/word-progress-stats/word-progress-badge";
import { Button } from "@/components/ui/button";
import { IWord } from "@/types/courses/courses.type";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import WordDetailCard from "./word-detail-card";

const AUTO_PLAY_AUDIO_DELAY_MS = 300;

export interface WordDetailsCarouselProps {
    words: IWord[];
    initialIndex?: number;
    onIndexChange?: (index: number) => void;
    cardLayout?: "horizontal" | "stack";
    navVariant?: "icons" | "minimal";
    headerSlot?: React.ReactNode;
    className?: string;
}

export default function WordDetailsCarousel({
    words,
    initialIndex = 0,
    onIndexChange,
    cardLayout = "horizontal",
    navVariant = "icons",
    headerSlot,
    className = "",
}: Readonly<WordDetailsCarouselProps>) {
    const [index, setIndex] = useState(initialIndex);
    const count = words.length;
    const effectiveIndex = count > 0 ? Math.min(index, count - 1) : 0;
    const word = count > 0 ? words[effectiveIndex] : null;

    useEffect(() => {
        onIndexChange?.(effectiveIndex);
    }, [effectiveIndex, onIndexChange]);

    // Auto-play word audio when slide changes (same pattern as practice-result-dialog)
    useEffect(() => {
        if (count === 0 || !word?.audioUrl) return;
        const timer = setTimeout(() => {
            const audio = new Audio(word.audioUrl);
            audio.play().catch(console.error);
        }, AUTO_PLAY_AUDIO_DELAY_MS);
        return () => clearTimeout(timer);
    }, [effectiveIndex, word?.audioUrl, count]);

    const goNext = useCallback(() => {
        setIndex((i) => (count > 0 ? (i + 1) % count : 0));
    }, [count]);

    const goPrev = useCallback(() => {
        setIndex((i) => (count > 0 ? (i - 1 + count) % count : 0));
    }, [count]);

    useEffect(() => {
        if (count === 0) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                goPrev();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                goNext();
            }
        };
        globalThis.addEventListener("keydown", handleKeyDown);
        return () => globalThis.removeEventListener("keydown", handleKeyDown);
    }, [count, goPrev, goNext]);

    if (count === 0) {
        return (
            <div className={`flex flex-col items-center justify-center py-12 text-muted-foreground ${className}`}>
                <p className="text-sm">No words to show.</p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col min-h-0 flex-1 gap-4 ${className}`}>
            {/* Nav + optional header — shrink-0 so card gets remaining space */}
            <div className="flex items-center justify-between gap-4 flex-wrap shrink-0">
                <Button
                    type="button"
                    variant="outline"
                    size={navVariant === "minimal" ? "icon" : "default"}
                    onClick={goPrev}
                    aria-label="Previous word"
                    className="shrink-0"
                >
                    <ChevronLeft className="h-5 w-5 sm:mr-1" />
                    {navVariant !== "minimal" && <span className="hidden sm:inline">Previous</span>}
                </Button>
                {headerSlot}
                <Button
                    type="button"
                    variant="outline"
                    size={navVariant === "minimal" ? "icon" : "default"}
                    onClick={goNext}
                    aria-label="Next word"
                    className="shrink-0"
                >
                    {navVariant !== "minimal" && <span className="hidden sm:inline">Next</span>}
                    <ChevronRight className="h-5 w-5 sm:ml-1" />
                </Button>
            </div>

            {/* Word progress stats (when available) */}
            {word?.wordProgress && (
                <div className="shrink-0 flex justify-center">
                    <WordProgressBadge progress={word.wordProgress} />
                </div>
            )}

            {/* Card: flex-1 min-h-0 so content fits in view; only examples scroll inside card */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col" key={effectiveIndex}>
                <WordDetailCard
                    word={word!}
                    layout={cardLayout}
                    constrainHeight
                    className="h-full animate-in fade-in duration-200"
                />
            </div>
        </div>
    );
}
