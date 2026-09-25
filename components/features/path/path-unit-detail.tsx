"use client";

import { BackLink } from "@/components/common/back-link/back-link";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/states";
import { PathNodeBadge } from "@/components/features/path/path-node-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-error";
import { CEFR_LABELS, lessonState, pathCheckpointHref, pathLessonHref } from "@/lib/path/path-tree";
import { cn } from "@/lib/utils";
import { usePathMeQuery, usePathUnitQuery } from "@/queries/path.query";
import type {
    PathNodeState,
    PathTreeLesson,
    PathUnitView,
} from "@/types/path/path.type";
import { CheckCircle2, Clock, Lock, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";

/** /path/unit/[unitId]: what the unit teaches and its lessons in order. */
export function PathUnitDetail({ unitId }: Readonly<{ unitId: string }>) {
    const unit = usePathUnitQuery(unitId);
    const me = usePathMeQuery();

    const back = (
        <BackLink href="/path" className="-ml-2 mb-4">
            Path
        </BackLink>
    );

    if (!unit.data && unit.isFetching) {
        return (
            <>
                {back}
                <UnitSkeleton />
            </>
        );
    }

    if (!unit.data) {
        const status = unit.error instanceof ApiError ? unit.error.status : undefined;
        return (
            <>
                {back}
                {status === 403 ? (
                    <EmptyState
                        icon={Lock}
                        title="This unit is locked"
                        description="Finish the units before it to open this one."
                        action={
                            <Button variant="play" asChild>
                                <Link href="/path">Back to the path</Link>
                            </Button>
                        }
                    />
                ) : status === 404 ? (
                    <EmptyState
                        title="Unit not found"
                        description="It may have moved in a newer version of the path."
                        action={
                            <Button variant="play" asChild>
                                <Link href="/path">Back to the path</Link>
                            </Button>
                        }
                    />
                ) : (
                    <ErrorState
                        message="Couldn't load this unit."
                        onRetry={() => void unit.refetch()}
                    />
                )}
            </>
        );
    }

    return (
        <>
            {back}
            <UnitContent view={unit.data} currentLessonId={me.data?.progress.currentLessonId} />
        </>
    );
}

function UnitContent({
    view,
    currentLessonId,
}: Readonly<{ view: PathUnitView; currentLessonId: string | null | undefined }>) {
    const { stage, unit, progress } = view;
    const checkpoint = progress.checkpoint;

    return (
        <div className="space-y-6">
            <header className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge>{CEFR_LABELS[stage.cefr]}</Badge>
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Unit {unit.order}
                    </span>
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight">{unit.title}</h1>
                <p className="text-lg font-semibold text-muted-foreground">{unit.titleVi}</p>
                {unit.descriptionVi && (
                    <p className="text-muted-foreground">{unit.descriptionVi}</p>
                )}
            </header>

            <section
                aria-labelledby="can-do"
                className="glass-surface rounded-3xl p-5"
            >
                <h2 id="can-do" className="mb-3 font-display text-base font-bold">
                    By the end of this unit
                </h2>
                <ul className="space-y-2">
                    {unit.canDo.map((line) => (
                        <li key={line} className="flex gap-2 text-sm">
                            <CheckCircle2
                                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-success)]"
                                aria-hidden
                            />
                            <span>{line}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section aria-labelledby="lessons">
                <h2 id="lessons" className="mb-3 font-display text-lg font-bold">
                    Lessons
                </h2>
                <ol className="space-y-3">
                    {unit.lessons.map((lesson) => (
                        <li key={lesson.id}>
                            <LessonRow
                                lesson={lesson}
                                state={lessonState(progress, lesson.id)}
                                current={lesson.id === currentLessonId}
                            />
                        </li>
                    ))}
                    {checkpoint && (
                        <li>
                            <CheckpointRow unitId={unit.id} state={checkpoint.state} />
                        </li>
                    )}
                </ol>
            </section>
        </div>
    );
}

function LessonRow({
    lesson,
    state,
    current,
}: Readonly<{ lesson: PathTreeLesson; state: PathNodeState; current: boolean }>) {
    const locked = state === "locked";

    return (
        <div
            className={cn(
                "flex items-center gap-4 rounded-2xl border-2 bg-card p-3 sm:p-4",
                current ? "border-primary/50 shadow-md" : "border-border",
                locked && "opacity-70",
            )}
        >
            <PathNodeBadge state={state} label={lesson.order} current={current} size="sm" />
            <div className="min-w-0 flex-1">
                <h3 className="font-display font-bold">{lesson.title}</h3>
                <p className="text-sm text-muted-foreground">{lesson.titleVi}</p>
                <p className="mt-1 flex flex-wrap gap-x-3 text-xs font-semibold text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        {lesson.estimatedMinutes} min
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden />
                        {lesson.newItemCount} new
                    </span>
                </p>
            </div>
            {!locked && (
                <Button
                    variant={state === "completed" ? "playOutline" : "play"}
                    size="sm"
                    asChild
                >
                    <Link href={pathLessonHref(lesson.id)}>
                        {state === "completed" ? "Review" : "Start"}
                    </Link>
                </Button>
            )}
        </div>
    );
}

function CheckpointRow({ unitId, state }: Readonly<{ unitId: string; state: PathNodeState }>) {
    return (
        <div
            className={cn(
                "flex items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card/60 p-3 sm:p-4",
                state === "locked" && "opacity-70",
            )}
        >
            <PathNodeBadge
                state={state}
                label={<Trophy className="h-4 w-4" />}
                size="sm"
            />
            <div className="min-w-0 flex-1">
                <h3 className="font-display font-bold">Unit test</h3>
                <p className="text-sm text-muted-foreground">
                    {state === "completed"
                        ? "Passed. The next unit is open."
                        : state === "available"
                          ? "Pass it to open the next unit."
                          : "Finish every lesson, then pass the test to open the next unit."}
                </p>
            </div>
            {state !== "locked" && (
                <Button
                    variant={state === "completed" ? "playOutline" : "play"}
                    size="sm"
                    asChild
                >
                    <Link href={pathCheckpointHref(unitId)}>
                        {state === "completed" ? "Retake" : "Start"}
                    </Link>
                </Button>
            )}
        </div>
    );
}

function UnitSkeleton() {
    return (
        <div aria-busy className="space-y-6">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-32 w-full rounded-3xl" />
            {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
        </div>
    );
}
