"use client";

import { ExplainStep } from "@/components/features/path/lesson-player/explain-step";
import { IntroStep } from "@/components/features/path/lesson-player/intro-step";
import { LessonSummary } from "@/components/features/path/lesson-player/lesson-summary";
import { QuizStep, type QuizResult } from "@/components/features/path/lesson-player/quiz-step";
import { SpeakStep } from "@/components/features/path/lesson-player/speak-step";
import { PracticeSessionHeader } from "@/components/features/vocabulary/practice-session-header";
import { stopSpeaking } from "@/lib/path/speech";
import { pathUnitHref } from "@/lib/path/path-tree";
import type { PathItem, PathLesson, PathStep } from "@/types/path/path.type";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

/**
 * The steps this player can run. WARMUP, PRACTICE, PATTERN_DRILL and DIALOGUE
 * arrive in P1-7b; until then they are skipped, so every lesson can still be
 * finished.
 */
type PlayableStep =
    | { id: string; type: "INTRO"; items: PathItem[] }
    | Extract<PathStep, { type: "EXPLAIN" | "SPEAK" | "QUIZ" }>;

function playableSteps(lesson: PathLesson): PlayableStep[] {
    const byId = new Map(lesson.items.map((item) => [item.id, item]));
    const steps: PlayableStep[] = [];
    for (const step of lesson.steps) {
        switch (step.type) {
            case "INTRO": {
                const items = step.payload.itemIds.flatMap((id) => byId.get(id) ?? []);
                if (items.length > 0) steps.push({ id: step.id, type: "INTRO", items });
                break;
            }
            case "EXPLAIN":
                steps.push(step);
                break;
            case "SPEAK":
                if (step.payload.lines.length > 0) steps.push(step);
                break;
            case "QUIZ":
                if (step.payload.questions.length > 0) steps.push(step);
                break;
            default:
                break;
        }
    }
    return steps;
}

/** Runs a lesson's steps in order, then shows the summary. */
export function LessonPlayer({ lesson }: Readonly<{ lesson: PathLesson }>) {
    const router = useRouter();
    const steps = useMemo(() => playableSteps(lesson), [lesson]);
    const [index, setIndex] = useState(0);
    const [quiz, setQuiz] = useState<QuizResult>({ correct: 0, total: 0 });

    // Don't keep talking after the learner leaves.
    useEffect(() => stopSpeaking, []);

    const finished = index >= steps.length;
    const step = steps[index];
    const next = () => {
        stopSpeaking();
        setIndex((i) => i + 1);
        globalThis.scrollTo?.({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="space-y-5">
            <PracticeSessionHeader
                currentIndex={finished ? steps.length : index}
                total={steps.length}
                courseName={lesson.title}
                subtitle={lesson.titleVi}
                onExit={() => router.push(pathUnitHref(lesson.unitId))}
            />

            {finished ? (
                <LessonSummary
                    lesson={lesson}
                    scorePercent={
                        quiz.total > 0 ? Math.round((quiz.correct / quiz.total) * 100) : undefined
                    }
                />
            ) : (
                // Keyed so every step starts with fresh local state.
                <div key={step.id}>
                    {step.type === "INTRO" && <IntroStep items={step.items} onDone={next} />}
                    {step.type === "EXPLAIN" && (
                        <ExplainStep
                            titleVi={step.payload.titleVi}
                            bodyVi={step.payload.bodyVi}
                            examples={step.payload.examples}
                            onDone={next}
                        />
                    )}
                    {step.type === "SPEAK" && <SpeakStep lines={step.payload.lines} onDone={next} />}
                    {step.type === "QUIZ" && (
                        <QuizStep
                            questions={step.payload.questions}
                            onDone={(result) => {
                                setQuiz((q) => ({
                                    correct: q.correct + result.correct,
                                    total: q.total + result.total,
                                }));
                                next();
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
