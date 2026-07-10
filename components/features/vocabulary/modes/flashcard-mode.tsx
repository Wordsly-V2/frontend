"use client";

import { AdaptiveText } from "@/components/common/adaptive-text";
import { WordPill } from "@/components/common/word-pill";
import { PracticeExerciseHeader } from "@/components/features/vocabulary/practice-exercise-header";
import { WordPracticeHints } from "@/components/features/vocabulary/word-practice-hints";
import { Button } from "@/components/ui/button";
import { type FlashcardRating } from "@/lib/answer-quality";
import { LONG_TEXT_WRAP } from "@/lib/long-text";
import { playAudioUrl } from "@/lib/practice-audio";
import { type WordLearningStage } from "@/lib/word-progress-stage";
import { IWord } from "@/types/courses/courses.type";
import { Volume2 } from "lucide-react";
import { memo } from "react";

/**
 * Self-graded flashcard: reveal the meaning, then rate recall on a 4-tier scale.
 * Rating colors come from the theme's brand tokens (success → accent → orange →
 * destructive), so they re-theme with the palette and work in light/dark.
 */
const RATING_BUTTONS: ReadonlyArray<{
    rating: FlashcardRating;
    label: string;
    shortcut: string;
    className: string;
}> = [
    {
        rating: "easy",
        label: "Easy",
        shortcut: "1",
        className:
            "border-[var(--brand-success)]/30 bg-[var(--brand-success)]/10 text-[var(--brand-success)] hover:bg-[var(--brand-success)]/20",
    },
    {
        rating: "good",
        label: "Got it",
        shortcut: "2",
        className:
            "border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/20",
    },
    {
        rating: "hard",
        label: "Hard",
        shortcut: "3",
        className:
            "border-[var(--brand-orange)]/30 bg-[var(--brand-orange)]/10 text-[var(--brand-orange)] hover:bg-[var(--brand-orange)]/20",
    },
    {
        rating: "forgot",
        label: "Forgot",
        shortcut: "4",
        className:
            "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20",
    },
];

export interface FlashcardModeProps {
    word: IWord;
    stage: WordLearningStage;
    showAnswer: boolean;
    maskedExamples: string[];
    showImageHints: boolean;
    onReveal: () => void;
    onRate: (rating: FlashcardRating) => void;
}

export const FlashcardMode = memo(function FlashcardMode({
    word,
    stage,
    showAnswer,
    maskedExamples,
    showImageHints,
    onReveal,
    onRate,
}: Readonly<FlashcardModeProps>) {
    return (
        <>
            <PracticeExerciseHeader mode="flashcard" stage={stage} />
            <div className="space-y-4 sm:space-y-6 text-center">
                <div>
                    <div className="flex flex-wrap items-center justify-center gap-3 mb-3 max-w-full">
                        <AdaptiveText
                            text={word.word}
                            role="word"
                            as="h2"
                            align="center"
                            className="font-display text-gradient-brand"
                        />
                        {word.audioUrl && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => playAudioUrl(word.audioUrl)}
                                className="rounded-xl shrink-0"
                            >
                                <Volume2 className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                    {word.pronunciation && (
                        <p className={`text-muted-foreground text-lg mb-2 ${LONG_TEXT_WRAP}`}>
                            {word.pronunciation}
                        </p>
                    )}
                    {word.partOfSpeech && (
                        <WordPill size="md">{word.partOfSpeech}</WordPill>
                    )}
                    {!showAnswer && (
                        <WordPracticeHints
                            maskedExamples={maskedExamples}
                            imageUrl={word.imageUrl}
                            showImageHints={showImageHints}
                        />
                    )}
                </div>
                {showAnswer && (
                    <div className="pt-4 border-t border-dashed border-border animate-in fade-in">
                        <AdaptiveText text={word.meaning} role="meaning" align="center" />
                    </div>
                )}
            </div>
            <div className="mt-6">
                {!showAnswer ? (
                    <div className="flex justify-center">
                        <Button
                            size="lg"
                            onClick={onReveal}
                            className="rounded-xl min-w-[180px]"
                        >
                            Reveal meaning
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3 animate-in fade-in">
                        <p className="text-sm text-muted-foreground text-center">
                            How well did you know it?
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {RATING_BUTTONS.map(({ rating, label, shortcut, className }) => (
                                <Button
                                    key={rating}
                                    variant="outline"
                                    onClick={() => onRate(rating)}
                                    className={`rounded-xl ${className}`}
                                >
                                    {label} <span className="text-xs opacity-70 ml-1">{shortcut}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
});
