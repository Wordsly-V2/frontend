"use client";

import {
    ChoiceQuestion,
    GapQuestion,
    OrderQuestion,
} from "@/components/features/path/lesson-player/quiz-questions";
import { StepFooter } from "@/components/features/path/lesson-player/step-footer";
import { usePracticeSettings } from "@/hooks/usePracticeSettings.hook";
import { pickCorrectMessage, pickIncorrectMessage } from "@/lib/practice-feedback";
import { playPracticeErrorSound, playPracticeSuccessSound } from "@/lib/practice-sounds";
import { correctAnswerText } from "@/lib/path/quiz";
import { cn } from "@/lib/utils";
import type { PathQuestion } from "@/types/path/path.type";
import { CheckCircle2, XCircle } from "lucide-react";
import { useCallback, useState } from "react";

export interface QuizResult {
    correct: number;
    total: number;
}

/** QUIZ: the lesson's questions in order; each is answered once. */
export function QuizStep({
    questions,
    onDone,
}: Readonly<{ questions: PathQuestion[]; onDone: (result: QuizResult) => void }>) {
    const { settings } = usePracticeSettings();
    const [index, setIndex] = useState(0);
    const [verdict, setVerdict] = useState<boolean | null>(null);
    const [correct, setCorrect] = useState(0);
    const question = questions[index];
    const last = index >= questions.length - 1;

    const onAnswer = useCallback(
        (isCorrect: boolean) => {
            setVerdict(isCorrect);
            if (isCorrect) setCorrect((n) => n + 1);
            if (settings.soundEnabled) {
                if (isCorrect) playPracticeSuccessSound();
                else playPracticeErrorSound();
            }
        },
        [settings.soundEnabled],
    );

    const next = () => {
        if (last) {
            onDone({ correct, total: questions.length });
            return;
        }
        setIndex(index + 1);
        setVerdict(null);
    };

    if (!question) return null;
    const answered = verdict !== null;
    const props = { answered, onAnswer };

    return (
        <div>
            <article className="glass-surface space-y-2 rounded-3xl p-5 sm:p-7">
                <p className="text-sm font-semibold text-muted-foreground">
                    Quiz · {index + 1} of {questions.length}
                </p>
                {/* Keyed so each question starts with fresh local state. */}
                <div key={index}>
                    {question.kind === "choice" && <ChoiceQuestion question={question} {...props} />}
                    {question.kind === "gap" && <GapQuestion question={question} {...props} />}
                    {question.kind === "order" && <OrderQuestion question={question} {...props} />}
                </div>
            </article>

            {answered && (
                <StepFooter label={last ? "Finish" : "Continue"} onClick={next}>
                    <div
                        role="status"
                        className={cn(
                            "flex gap-3 rounded-2xl p-4",
                            verdict ? "bg-[var(--brand-success)]/12" : "bg-destructive/10",
                        )}
                    >
                        {verdict ? (
                            <CheckCircle2 className="h-6 w-6 shrink-0 text-[var(--brand-success)]" aria-hidden />
                        ) : (
                            <XCircle className="h-6 w-6 shrink-0 text-destructive" aria-hidden />
                        )}
                        <div className="space-y-1 text-sm">
                            <p className="font-bold">
                                {verdict ? pickCorrectMessage(index) : pickIncorrectMessage(index)}
                            </p>
                            {!verdict && (
                                <p>
                                    Answer: <span className="font-semibold">{correctAnswerText(question)}</span>
                                </p>
                            )}
                            {question.explanationVi && <p className="text-muted-foreground">{question.explanationVi}</p>}
                        </div>
                    </div>
                </StepFooter>
            )}
        </div>
    );
}
