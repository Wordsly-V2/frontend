"use client";

import { Mascot } from "@/components/common/motion";
import { ChoiceQuestion, GapQuestion, OrderQuestion } from "@/components/features/path/lesson-player/quiz-questions";
import { PracticeSessionHeader } from "@/components/features/vocabulary/practice-session-header";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-error";
import { fireCelebrationConfetti } from "@/lib/confetti";
import { newClientRequestId } from "@/lib/offline/sync-queue";
import { pathLessonHref, pathUnitHref } from "@/lib/path/path-tree";
import { stopSpeaking } from "@/lib/path/speech";
import { cn } from "@/lib/utils";
import { useSubmitPathCheckpointMutation } from "@/queries/path.query";
import type {
    PathCheckpointQuestion,
    PathCheckpointResponse,
    PathCheckpointResult,
    PathCheckpointView,
} from "@/types/path/path.type";
import { ArrowRight, CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * A unit test: the questions one after another with no feedback, one submit at
 * the end, graded on the server. The server reveals the answers only on a pass.
 */
export function CheckpointPlayer({
    checkpoint,
    onReload,
}: Readonly<{ checkpoint: PathCheckpointView; onReload: () => void }>) {
    const router = useRouter();
    const submit = useSubmitPathCheckpointMutation();
    const { questions, unitId } = checkpoint;
    const [attempt, setAttempt] = useState(0);
    const [responses, setResponses] = useState<PathCheckpointResponse[]>([]);
    // One id per attempt: resending after a network error returns the first grade.
    const requestId = useRef<string | null>(null);

    useEffect(() => stopSpeaking, []);

    const index = responses.length;
    const question = questions[index];
    const last = index === questions.length - 1;

    const send = (answers: PathCheckpointResponse[]) => {
        requestId.current ??= newClientRequestId();
        submit.mutate({
            unitId,
            body: { clientRequestId: requestId.current, releaseId: checkpoint.releaseId, answers },
        });
    };

    const answer = (response: PathCheckpointResponse) => {
        stopSpeaking();
        const next = [...responses, response];
        setResponses(next);
        if (next.length === questions.length) send(next);
        globalThis.scrollTo?.({ top: 0, behavior: "smooth" });
    };

    const retry = () => {
        requestId.current = null;
        submit.reset();
        setResponses([]);
        setAttempt((n) => n + 1);
    };

    const outdated = submit.error instanceof ApiError && submit.error.status === 409;

    return (
        <div className="space-y-5">
            <PracticeSessionHeader
                currentIndex={index}
                total={questions.length}
                courseName="Unit test"
                subtitle={`Pass with ${checkpoint.passPercent}% or more`}
                onExit={() => router.push(pathUnitHref(unitId))}
            />

            {question ? (
                <article className="glass-surface space-y-2 rounded-3xl p-5 sm:p-7">
                    <p className="text-sm font-semibold text-muted-foreground">
                        Question {index + 1} of {questions.length}
                    </p>
                    {/* Keyed so each question (and each attempt) starts fresh. */}
                    <div key={`${attempt}-${index}`}>
                        <CheckpointQuestionView
                            question={question}
                            submitLabel={last ? "Submit" : "Next"}
                            onAnswer={answer}
                        />
                    </div>
                </article>
            ) : submit.data ? (
                <CheckpointResults
                    unitId={unitId}
                    questions={questions}
                    result={submit.data}
                    onRetry={retry}
                />
            ) : (
                <section
                    role="status"
                    className="glass-surface flex flex-col items-center gap-4 rounded-3xl p-8 text-center"
                >
                    {submit.isError ? (
                        <>
                            <p className="font-semibold">
                                {outdated
                                    ? "This unit test was updated while you took it."
                                    : "Couldn't grade your answers."}
                            </p>
                            {outdated ? (
                                <Button variant="play" size="lg" onClick={onReload}>
                                    Load the new test
                                </Button>
                            ) : (
                                <Button variant="play" size="lg" onClick={() => send(responses)} className="gap-2">
                                    <RotateCcw className="h-4 w-4" aria-hidden />
                                    Try again
                                </Button>
                            )}
                        </>
                    ) : (
                        <>
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
                            <p className="font-semibold">Grading your answers…</p>
                        </>
                    )}
                </section>
            )}
        </div>
    );
}

function CheckpointQuestionView({
    question,
    submitLabel,
    onAnswer,
}: Readonly<{
    question: PathCheckpointQuestion;
    submitLabel: string;
    onAnswer: (response: PathCheckpointResponse) => void;
}>) {
    const props = { answered: false, submitLabel, onAnswer };
    switch (question.kind) {
        case "choice":
            return <ChoiceQuestion question={question} {...props} />;
        case "gap":
            return <GapQuestion question={question} {...props} />;
        case "order":
            return <OrderQuestion question={{ vi: question.vi, words: question.tiles }} {...props} />;
    }
}

function questionLabel(question: PathCheckpointQuestion): string {
    switch (question.kind) {
        case "choice":
            return question.prompt;
        case "gap":
            return question.sentence;
        case "order":
            return question.vi;
    }
}

function CheckpointResults({
    unitId,
    questions,
    result,
    onRetry,
}: Readonly<{
    unitId: string;
    questions: PathCheckpointQuestion[];
    result: PathCheckpointResult;
    onRetry: () => void;
}>) {
    const { passed, scorePercent, passPercent } = result;
    const nextLessonId = result.me.progress.currentLessonId;

    // Once per result (the ref also survives StrictMode's double effect).
    const celebrated = useRef(false);
    useEffect(() => {
        if (!passed || celebrated.current) return;
        celebrated.current = true;
        fireCelebrationConfetti();
    }, [passed]);

    return (
        <section className="space-y-5">
            <div className="glass-surface flex flex-col items-center gap-4 rounded-3xl p-6 text-center sm:p-10">
                <Mascot mood={passed ? "celebrate" : "idle"} />
                <div className="space-y-1">
                    <h1 className="font-display text-3xl font-bold">
                        {passed ? "Unit test passed!" : "Not quite yet"}
                    </h1>
                    <p className="text-muted-foreground">
                        {passed
                            ? "The next unit is open."
                            : `You need ${passPercent}% to pass. Review the lessons, then try again.`}
                    </p>
                </div>
                <p className="font-display text-5xl font-bold">{scorePercent}%</p>

                <div className="flex flex-col gap-3 sm:flex-row">
                    {passed ? (
                        nextLessonId && (
                            <Button variant="play" size="lg" asChild>
                                <Link href={pathLessonHref(nextLessonId)} className="gap-2">
                                    Next lesson
                                    <ArrowRight className="h-4 w-4" aria-hidden />
                                </Link>
                            </Button>
                        )
                    ) : (
                        <Button variant="play" size="lg" onClick={onRetry} className="gap-2">
                            <RotateCcw className="h-4 w-4" aria-hidden />
                            Try again
                        </Button>
                    )}
                    <Button variant="playOutline" size="lg" asChild>
                        <Link href={passed ? "/path" : pathUnitHref(unitId)}>
                            {passed ? "Back to the path" : "Review the unit"}
                        </Link>
                    </Button>
                </div>
            </div>

            <ol className="space-y-2" aria-label="Your answers">
                {questions.map((question, i) => {
                    const item = result.results[i];
                    if (!item) return null;
                    return (
                        <li
                            key={i}
                            className={cn(
                                "flex gap-3 rounded-2xl border-2 bg-card p-3 text-sm sm:p-4",
                                item.correct ? "border-border" : "border-destructive/40",
                            )}
                        >
                            {item.correct ? (
                                <CheckCircle2
                                    className="h-5 w-5 shrink-0 text-[var(--brand-success)]"
                                    aria-label="Correct"
                                />
                            ) : (
                                <XCircle className="h-5 w-5 shrink-0 text-destructive" aria-label="Wrong" />
                            )}
                            <div className="min-w-0 space-y-1">
                                <p className="font-semibold">{questionLabel(question)}</p>
                                {!item.correct && item.correctAnswer && (
                                    <p>
                                        Answer: <span className="font-semibold">{item.correctAnswer}</span>
                                    </p>
                                )}
                                {item.explanationVi && (
                                    <p className="text-muted-foreground">{item.explanationVi}</p>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
