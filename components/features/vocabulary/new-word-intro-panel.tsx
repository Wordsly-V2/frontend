"use client";

import WordDetailCard from "@/components/features/vocabulary/word-detail-card";
import { LearningStepIndicator } from "@/components/features/vocabulary/learning-step-indicator";
import { PracticeCardShell } from "@/components/features/vocabulary/practice-card-shell";
import { Button } from "@/components/ui/button";
import type { IWord } from "@/types/courses/courses.type";
import { ChevronRight } from "lucide-react";
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
        <PracticeCardShell
            variant="intro"
            className="sm:p-6 md:p-8 animate-in fade-in duration-300"
        >
            <LearningStepIndicator activeStep="intro" className="mb-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-4 text-center">
                New word — read, listen, then practice
            </p>
            <div className="flex-1 min-h-0 flex flex-col">
                <WordDetailCard
                    word={word}
                    layout="stack"
                    constrainHeight
                    className="flex-1 min-h-0"
                />
            </div>
            <div className="flex-shrink-0 pt-4 sm:pt-6 flex flex-col items-center gap-2">
                <Button
                    size="lg"
                    onClick={onStartExercise}
                    className="rounded-xl gap-2 min-w-[200px]"
                >
                    Practice this word
                    <ChevronRight className="h-4 w-4" aria-hidden />
                </Button>
                <p className="text-xs text-muted-foreground">Press Enter when ready</p>
            </div>
        </PracticeCardShell>
    );
}
