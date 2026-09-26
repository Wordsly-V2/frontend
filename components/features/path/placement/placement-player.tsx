"use client";

import { Mascot } from "@/components/common/motion";
import { ChoiceQuestion, GapQuestion, OrderQuestion } from "@/components/features/path/lesson-player/quiz-questions";
import { PracticeSessionHeader } from "@/components/features/vocabulary/practice-session-header";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-error";
import { fireCelebrationConfetti } from "@/lib/confetti";
import { newClientRequestId } from "@/lib/offline/sync-queue";
import { CEFR_LABELS, findUnit, pathLessonHref } from "@/lib/path/path-tree";
import { padPlacementAnswers, placementOutcome } from "@/lib/path/placement";
import { stopSpeaking } from "@/lib/path/speech";
import { cn } from "@/lib/utils";
import { useSubmitPathPlacementMutation } from "@/queries/path.query";
import type {
    PathMe,
    PathPlacementQuestion,
    PathPlacementResponse,
    PathPlacementResult,
    PathPlacementView,
    PathTree,
} from "@/types/path/path.type";
import { ArrowRight, CheckCircle2, Circle, Compass, Loader2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * The placement test: an intro, then the questions in path order with no
 * feedback, and one submit, graded on the server. The learner can say "I
 * don't know" to a question, or stop and be placed where they stopped; the
 * questions never reached go as null. Answers are never shown.
 */
export function PlacementPlayer({
    placement,
    tree,
    me,
    onReload,
}: Readonly<{
    placement: PathPlacementView;
    tree: PathTree | null;
    me: PathMe | undefined;
    onReload: () => void;
}>) {
    const router = useRouter();
    const submit = useSubmitPathPlacementMutation();
    const { questions } = placement;
    const [started, setStarted] = useState(false);
    const [responses, setResponses] = useState<PathPlacementResponse[]>([]);
    const [stopped, setStopped] = useState(false);
    // One id per attempt: resending after a network error returns the first grade.
    const requestId = useRef<string | null>(null);

    useEffect(() => stopSpeaking, []);

    const index = responses.length;
    const question = stopped ? undefined : questions[index];
    const last = index === questions.length - 1;
    const located = findUnit(tree, question?.unitId);

    const send = (answers: PathPlacementResponse[]) => {
        requestId.current ??= newClientRequestId();
        submit.mutate({
            clientRequestId: requestId.current,
            releaseId: placement.releaseId,
            answers: padPlacementAnswers(answers, questions.length),
        });
    };

    const answer = (response: PathPlacementResponse) => {
        stopSpeaking();
        const next = [...responses, response];
        setResponses(next);
        if (next.length === questions.length) send(next);
        globalThis.scrollTo?.({ top: 0, behavior: "smooth" });
    };

    const stop = () => {
        stopSpeaking();
        setStopped(true);
        send(responses);
    };

    if (!started) {
        return (
            <PlacementIntro
                placement={placement}
                me={me}
                onStart={() => setStarted(true)}
            />
        );
    }

    const outdated = submit.error instanceof ApiError && submit.error.status === 409;

    return (
        <div className="space-y-5">
            <PracticeSessionHeader
                currentIndex={index}
                total={questions.length}
                courseName="Placement test"
                subtitle={located ? `${CEFR_LABELS[located.stage.cefr]} · ${located.stage.title}` : undefined}
                onExit={() => router.push("/path")}
            />

            {question ? (
                <article className="glass-surface space-y-4 rounded-3xl p-5 sm:p-7">
                    <p className="text-sm font-semibold text-muted-foreground">
                        Question {index + 1} of {questions.length}
                    </p>
                    {/* Keyed so each question starts fresh. */}
                    <div key={index}>
                        <PlacementQuestionView
                            question={question}
                            submitLabel={last ? "Finish" : "Next"}
                            onAnswer={answer}
                        />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
                        <Button variant="ghost" onClick={() => answer(null)}>
                            I don&apos;t know
                        </Button>
                        {index > 0 && (
                            <Button variant="outline" onClick={stop}>
                                It&apos;s getting too hard: stop here
                            </Button>
                        )}
                    </div>
                </article>
            ) : submit.data ? (
                <PlacementResults tree={tree} result={submit.data} />
            ) : (
                <section
                    role="status"
                    className="glass-surface flex flex-col items-center gap-4 rounded-3xl p-8 text-center"
                >
                    {submit.isError ? (
                        <>
                            <p className="font-semibold">
                                {outdated
                                    ? "The placement test was updated while you took it."
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
                            <p className="font-semibold">Finding your level…</p>
                        </>
                    )}
                </section>
            )}
        </div>
    );
}

function PlacementIntro({
    placement,
    me,
    onStart,
}: Readonly<{ placement: PathPlacementView; me: PathMe | undefined; onStart: () => void }>) {
    const started = (me?.progress.completedLessonCount ?? 0) > 0 || !!me?.startUnitId;
    const minutes = Math.max(5, Math.round(placement.questions.length / 3));

    return (
        <section className="glass-surface flex flex-col items-center gap-5 rounded-3xl p-6 text-center sm:p-10">
            <Compass className="h-10 w-10 text-primary" aria-hidden />
            <div className="space-y-2">
                <h1 className="font-display text-3xl font-bold">Find your level</h1>
                <p className="mx-auto max-w-md text-muted-foreground">
                    {placement.questions.length} short questions, from the first words up, about {minutes} minutes.
                    Answer what you know. When it gets too hard, stop, and you start right there.
                </p>
                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                    {started
                        ? "Your progress is kept: the test can only move you forward."
                        : "Units before your level count as done, and you can still open them any time."}
                </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="play" size="lg" onClick={onStart} className="gap-2">
                    Start the test
                    <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
                <Button variant="playOutline" size="lg" asChild>
                    <Link href="/path">Not now</Link>
                </Button>
            </div>
        </section>
    );
}

function PlacementQuestionView({
    question,
    submitLabel,
    onAnswer,
}: Readonly<{
    question: PathPlacementQuestion;
    submitLabel: string;
    onAnswer: (response: PathPlacementResponse) => void;
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

function PlacementResults({
    tree,
    result,
}: Readonly<{ tree: PathTree | null; result: PathPlacementResult }>) {
    const { start, keptLaterStart, skippedUnitCount } = placementOutcome(tree, result);
    const nextLessonId = result.me.progress.currentLessonId;

    // Once per result (the ref also survives StrictMode's double effect).
    const celebrated = useRef(false);
    useEffect(() => {
        if (skippedUnitCount === 0 || celebrated.current) return;
        celebrated.current = true;
        fireCelebrationConfetti();
    }, [skippedUnitCount]);

    return (
        <section className="space-y-5">
            <div className="glass-surface flex flex-col items-center gap-4 rounded-3xl p-6 text-center sm:p-10">
                <Mascot mood={skippedUnitCount > 0 ? "celebrate" : "idle"} />
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-muted-foreground">
                        {start ? `${CEFR_LABELS[start.stage.cefr]} · ${start.stage.title}` : "Your level"}
                    </p>
                    <h1 className="font-display text-3xl font-bold">
                        {start ? `Start at Unit ${start.unit.order}: ${start.unit.title}` : "Start from the beginning"}
                    </h1>
                    <p className="mx-auto max-w-md text-muted-foreground">
                        {keptLaterStart
                            ? "You're already further along than this, so your place on the path stays."
                            : skippedUnitCount > 0
                              ? `${skippedUnitCount} ${skippedUnitCount === 1 ? "unit counts" : "units count"} as done. You can still open them any time.`
                              : "The first units build the basics, and they go quickly if you know some already."}
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    {nextLessonId && (
                        <Button variant="play" size="lg" asChild>
                            <Link href={pathLessonHref(nextLessonId)} className="gap-2">
                                Start learning
                                <ArrowRight className="h-4 w-4" aria-hidden />
                            </Link>
                        </Button>
                    )}
                    <Button variant="playOutline" size="lg" asChild>
                        <Link href="/path">See the path</Link>
                    </Button>
                </div>
            </div>

            <ol className="grid gap-2 sm:grid-cols-2" aria-label="What the test found">
                {result.units.map((unit) => {
                    const located = findUnit(tree, unit.unitId);
                    if (!located) return null;
                    return (
                        <li
                            key={unit.unitId}
                            className={cn(
                                "flex items-center gap-3 rounded-2xl border-2 bg-card p-3 text-sm",
                                unit.known ? "border-border" : "border-dashed border-border",
                            )}
                        >
                            {unit.known ? (
                                <CheckCircle2
                                    className="h-5 w-5 shrink-0 text-[var(--brand-success)]"
                                    aria-label="You know this"
                                />
                            ) : (
                                <Circle className="h-5 w-5 shrink-0 text-muted-foreground" aria-label="To learn" />
                            )}
                            <span className="min-w-0">
                                <span className="block truncate font-semibold">{located.unit.title}</span>
                                <span className="text-muted-foreground">
                                    {CEFR_LABELS[located.stage.cefr]} · Unit {located.unit.order}
                                </span>
                            </span>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
