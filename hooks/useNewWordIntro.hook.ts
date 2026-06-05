import { useCallback, useEffect, useState } from "react";
import { playAudioUrl } from "@/lib/practice-audio";
import type { WordLearningStep } from "@/types/practice/practice.type";
import type { WordLearningStage } from "@/lib/word-progress-stage";
import type { IWord } from "@/types/courses/courses.type";

interface UseNewWordIntroOptions {
    word: IWord | undefined;
    wordId: string | undefined;
    stage: WordLearningStage;
    practicePass: "main" | "retry-missed";
    onExerciseStart?: () => void;
}

export function useNewWordIntro({
    word,
    wordId,
    stage,
    practicePass,
    onExerciseStart,
}: UseNewWordIntroOptions) {
    const [wordStep, setWordStep] = useState<WordLearningStep>("exercise");

    const showIntro =
        wordStep === "intro" && stage === "new" && practicePass === "main";

    useEffect(() => {
        if (!wordId || practicePass !== "main") {
            setWordStep("exercise");
            return;
        }
        setWordStep(stage === "new" ? "intro" : "exercise");
    }, [wordId, stage, practicePass]);

    useEffect(() => {
        if (!showIntro || !word?.audioUrl) return;
        const timer = setTimeout(() => playAudioUrl(word.audioUrl), 300);
        return () => clearTimeout(timer);
    }, [showIntro, word?.audioUrl, wordId]);

    const startExercise = useCallback(() => {
        setWordStep("exercise");
        onExerciseStart?.();
    }, [onExerciseStart]);

    return { showIntro, startExercise };
}
