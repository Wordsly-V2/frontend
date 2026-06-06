"use client";

import WordDetailCard from "@/components/features/vocabulary/word-detail-card";
import { LearningStepIndicator } from "@/components/features/vocabulary/learning-step-indicator";
import { PracticeCardShell } from "@/components/features/vocabulary/practice-card-shell";
import { Button } from "@/components/ui/button";
import type { IWord } from "@/types/courses/courses.type";
import { ArrowRight } from "lucide-react";
import { useEnterKeyAction } from "@/lib/keyboard-utils";

interface NewWordIntroPanelProps {
    word: IWord;
    onStartExercise: () => void;
}

export function NewWordIntroPanel({
    word,
    onStartExercise,
}: Readonly<NewWordIntroPanelProps>) {
    useEnterKeyAction(onStartExercise, true);

    return (
        <PracticeCardShell variant="intro" className="animate-in fade-in duration-300">
            <LearningStepIndicator activeStep="intro" className="mb-5" />
            <p className="text-center text-sm text-muted-foreground mb-4">
                Take a moment to read and listen — then you&apos;ll practice this word.
            </p>
            <div className="flex-1 min-h-0 flex flex-col">
                <WordDetailCard
                    word={word}
                    layout="stack"
                    constrainHeight
                    className="flex-1 min-h-0"
                />
            </div>
            <div className="flex-shrink-0 pt-5 flex flex-col items-center gap-2">
                <Button
                    size="lg"
                    onClick={onStartExercise}
                    className="rounded-xl gap-2 min-w-[200px] gradient-brand text-white shadow-md"
                >
                    Start practicing
                    <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
                <p className="text-xs text-muted-foreground">Press Enter when ready</p>
            </div>
        </PracticeCardShell>
    );
}
