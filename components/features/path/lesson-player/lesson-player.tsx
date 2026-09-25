"use client";

import { DialogueStep } from "@/components/features/path/lesson-player/dialogue-step";
import { ExplainStep } from "@/components/features/path/lesson-player/explain-step";
import { IntroStep } from "@/components/features/path/lesson-player/intro-step";
import { LessonSummary } from "@/components/features/path/lesson-player/lesson-summary";
import { PatternDrillStep } from "@/components/features/path/lesson-player/pattern-drill-step";
import { PracticeStep } from "@/components/features/path/lesson-player/practice-step";
import { QuizStep, type QuizResult } from "@/components/features/path/lesson-player/quiz-step";
import { SpeakStep } from "@/components/features/path/lesson-player/speak-step";
import { WarmupStep } from "@/components/features/path/lesson-player/warmup-step";
import { PracticeSessionHeader } from "@/components/features/vocabulary/practice-session-header";
import { stopSpeaking } from "@/lib/path/speech";
import { pathUnitHref } from "@/lib/path/path-tree";
import type { PathItem, PathItemRole, PathLesson, PathStep } from "@/types/path/path.type";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type LessonItem = PathItem & { role: PathItemRole };

/** A step with its item references resolved against the lesson's items. */
type PlayableStep =
    | { id: string; type: "INTRO"; items: PathItem[] }
    | { id: string; type: "PRACTICE"; items: LessonItem[]; modes: string[] }
    | {
          id: string;
          type: "PATTERN_DRILL";
          pattern: PathItem;
          prompts: Extract<PathStep, { type: "PATTERN_DRILL" }>["payload"]["prompts"];
      }
    | Extract<PathStep, { type: "WARMUP" | "EXPLAIN" | "SPEAK" | "DIALOGUE" | "QUIZ" }>;

/** The lesson's steps, minus any with nothing to show. */
function playableSteps(lesson: PathLesson): PlayableStep[] {
    const byId = new Map(lesson.items.map((item) => [item.id, item]));
    const resolve = (ids: string[]) => ids.flatMap((id) => byId.get(id) ?? []);
    const steps: PlayableStep[] = [];
    for (const step of lesson.steps) {
        switch (step.type) {
            case "INTRO": {
                const items = resolve(step.payload.itemIds);
                if (items.length > 0) steps.push({ id: step.id, type: "INTRO", items });
                break;
            }
            case "PRACTICE": {
                const items = resolve(step.payload.itemIds);
                if (items.length > 0) {
                    steps.push({ id: step.id, type: "PRACTICE", items, modes: step.payload.modes });
                }
                break;
            }
            case "PATTERN_DRILL": {
                const pattern = byId.get(step.payload.patternId);
                if (pattern?.pattern && step.payload.prompts.length > 0) {
                    steps.push({
                        id: step.id,
                        type: "PATTERN_DRILL",
                        pattern,
                        prompts: step.payload.prompts,
                    });
                }
                break;
            }
            case "SPEAK":
                if (step.payload.lines.length > 0) steps.push(step);
                break;
            case "DIALOGUE":
                if (step.payload.dialogue.lines.length > 0) steps.push(step);
                break;
            case "QUIZ":
                if (step.payload.questions.length > 0) steps.push(step);
                break;
            case "WARMUP":
            case "EXPLAIN":
                steps.push(step);
                break;
        }
    }
    return steps;
}

/** Steps that run the practice engine, which brings its own session header. */
const ENGINE_STEPS = new Set<PlayableStep["type"]>(["WARMUP", "PRACTICE"]);

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
    const exit = () => router.push(pathUnitHref(lesson.unitId));
    // Moves on from `from` only: a step that reports done twice (StrictMode's
    // double effect on a step that skips itself) must not skip the next one.
    const advanceFrom = (from: number) => {
        stopSpeaking();
        setIndex((i) => (i === from ? i + 1 : i));
        globalThis.scrollTo?.({ top: 0, behavior: "smooth" });
    };
    const next = () => advanceFrom(index);
    const engineStep = !finished && ENGINE_STEPS.has(step.type);

    return (
        <div className="space-y-5">
            {!engineStep && (
                <PracticeSessionHeader
                    currentIndex={finished ? steps.length : index}
                    total={steps.length}
                    courseName={lesson.title}
                    subtitle={lesson.titleVi}
                    onExit={exit}
                />
            )}

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
                    {step.type === "WARMUP" && (
                        <WarmupStep
                            lessonId={lesson.id}
                            maxItems={step.payload.maxItems}
                            lessonTitle={lesson.title}
                            onExit={exit}
                            onDone={next}
                        />
                    )}
                    {step.type === "INTRO" && <IntroStep items={step.items} onDone={next} />}
                    {step.type === "PRACTICE" && (
                        <PracticeStep
                            items={step.items}
                            modes={step.modes}
                            lessonTitle={lesson.title}
                            subtitle={`Practice · step ${index + 1} of ${steps.length}`}
                            onExit={exit}
                            onDone={next}
                        />
                    )}
                    {step.type === "PATTERN_DRILL" && (
                        <PatternDrillStep pattern={step.pattern} prompts={step.prompts} onDone={next} />
                    )}
                    {step.type === "DIALOGUE" && (
                        <DialogueStep
                            dialogue={step.payload.dialogue}
                            mode={step.payload.mode}
                            onDone={next}
                        />
                    )}
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
