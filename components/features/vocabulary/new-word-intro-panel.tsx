"use client";

import { Pop } from "@/components/common/motion";
import WordDetailCard from "@/components/features/vocabulary/word-detail-card";
import { LearningStepIndicator } from "@/components/features/vocabulary/learning-step-indicator";
import { PracticeFooterBar } from "@/components/features/vocabulary/practice-footer-bar";
import { Button } from "@/components/ui/button";
import type { IWord } from "@/types/courses/courses.type";
import { ArrowRight } from "lucide-react";
import { useEnterKeyAction } from "@/lib/keyboard-utils";

interface NewWordIntroPanelProps {
    word: IWord;
    onStartExercise: () => void;
}

/** A new word's Learn card: read and listen, then the footer button starts the exercise. */
export function NewWordIntroPanel({
    word,
    onStartExercise,
}: Readonly<NewWordIntroPanelProps>) {
    useEnterKeyAction(onStartExercise, true);

    return (
        <div className="flex flex-col animate-in fade-in duration-300">
            <LearningStepIndicator activeStep="intro" className="mb-4" />
            <Pop>
                <WordDetailCard word={word} layout="stack" className="shadow-sm" />
            </Pop>
            <PracticeFooterBar
                title="New word"
                detail="Read it and listen. Then you'll practice it."
                action={
                    <Button variant="play" size="lg" onClick={onStartExercise} className="w-full gap-2">
                        Start practicing
                        <ArrowRight className="h-4 w-4" aria-hidden />
                    </Button>
                }
            />
        </div>
    );
}
