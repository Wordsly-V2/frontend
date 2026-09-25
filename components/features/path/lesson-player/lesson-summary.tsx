"use client";

import { Mascot } from "@/components/common/motion";
import { Button } from "@/components/ui/button";
import { fireCelebrationConfetti } from "@/lib/confetti";
import { newClientRequestId } from "@/lib/offline/sync-queue";
import { pathLessonHref, pathUnitHref } from "@/lib/path/path-tree";
import { useCompletePathLessonMutation } from "@/queries/path.query";
import type { PathLesson } from "@/types/path/path.type";
import { ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";

/**
 * End of a lesson: records the completion (once; a retry reuses the same
 * clientRequestId, so the server applies it at most once) and offers the next
 * lesson the server says is open.
 */
export function LessonSummary({
    lesson,
    scorePercent,
}: Readonly<{ lesson: PathLesson; scorePercent: number | undefined }>) {
    const complete = useCompletePathLessonMutation();
    const requestId = useRef<string | null>(null);
    const { mutate } = complete;

    const save = useCallback(() => {
        requestId.current ??= newClientRequestId();
        mutate({
            lessonId: lesson.id,
            body: { clientRequestId: requestId.current, scorePercent },
        });
    }, [lesson.id, mutate, scorePercent]);

    // Once per mount (the ref also survives StrictMode's double effect).
    const started = useRef(false);
    useEffect(() => {
        if (started.current) return;
        started.current = true;
        fireCelebrationConfetti();
        save();
    }, [save]);

    const newCount = lesson.items.filter((item) => item.role === "INTRODUCE").length;
    const nextLessonId = complete.data?.me.progress.currentLessonId;

    return (
        <section className="glass-surface flex flex-col items-center gap-5 rounded-3xl p-6 text-center sm:p-10">
            <Mascot mood="celebrate" />
            <div className="space-y-1">
                <h1 className="font-display text-3xl font-bold">Lesson complete!</h1>
                <p className="text-muted-foreground">
                    {lesson.title} · {lesson.titleVi}
                </p>
            </div>

            <dl className="grid w-full max-w-sm grid-cols-2 gap-3">
                <div className="rounded-2xl border-2 border-border bg-card p-4">
                    <dt className="text-xs font-semibold uppercase text-muted-foreground">New</dt>
                    <dd className="font-display text-2xl font-bold">{newCount}</dd>
                </div>
                <div className="rounded-2xl border-2 border-border bg-card p-4">
                    <dt className="text-xs font-semibold uppercase text-muted-foreground">Quiz</dt>
                    <dd className="font-display text-2xl font-bold">
                        {scorePercent === undefined ? "–" : `${scorePercent}%`}
                    </dd>
                </div>
            </dl>

            <p role="status" className="text-sm text-muted-foreground">
                {complete.isPending && "Saving your progress…"}
                {complete.isSuccess && "Progress saved."}
                {complete.isError && "Couldn't save your progress."}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
                {complete.isError && (
                    <Button variant="play" size="lg" onClick={save} className="gap-2">
                        <RotateCcw className="h-4 w-4" aria-hidden />
                        Try again
                    </Button>
                )}
                {complete.isSuccess && nextLessonId && nextLessonId !== lesson.id && (
                    <Button variant="play" size="lg" asChild>
                        <Link href={pathLessonHref(nextLessonId)} className="gap-2">
                            Next lesson
                            <ArrowRight className="h-4 w-4" aria-hidden />
                        </Link>
                    </Button>
                )}
                <Button variant="playOutline" size="lg" asChild>
                    <Link href={pathUnitHref(lesson.unitId)}>Back to unit</Link>
                </Button>
            </div>
        </section>
    );
}
