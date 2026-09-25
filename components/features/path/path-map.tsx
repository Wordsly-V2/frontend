"use client";

import { Bounce } from "@/components/common/motion";
import { Badge } from "@/components/ui/badge";
import { PathNodeBadge } from "@/components/features/path/path-node-badge";
import {
    CEFR_LABELS,
    pathUnitHref,
    unitCompletion,
    unitProgressById,
} from "@/lib/path/path-tree";
import { cn } from "@/lib/utils";
import type {
    PathMe,
    PathNodeState,
    PathTree,
    PathTreeStage,
    PathTreeUnit,
    PathUnitProgress,
} from "@/types/path/path.type";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

/** Every stage of the path, with its units as a vertical trail of nodes. */
export function PathMap({ tree, me }: Readonly<{ tree: PathTree; me: PathMe }>) {
    const progress = unitProgressById(me);
    const currentUnitId = me.progress.units.find((unit) =>
        unit.lessons.some((lesson) => lesson.lessonId === me.progress.currentLessonId),
    )?.unitId;

    return (
        <div className="space-y-10">
            {tree.stages.map((stage) => (
                <StageSection
                    key={stage.id}
                    stage={stage}
                    progress={progress}
                    currentUnitId={currentUnitId}
                />
            ))}
        </div>
    );
}

function StageSection({
    stage,
    progress,
    currentUnitId,
}: Readonly<{
    stage: PathTreeStage;
    progress: Map<string, PathUnitProgress>;
    currentUnitId: string | undefined;
}>) {
    const comingSoon = stage.units.length === 0;

    return (
        <section aria-labelledby={`stage-${stage.id}`}>
            <header className="mb-4 flex items-start gap-3">
                <Badge variant={comingSoon ? "muted" : "default"} className="mt-1 text-sm">
                    {CEFR_LABELS[stage.cefr]}
                </Badge>
                <div className="min-w-0">
                    <h2 id={`stage-${stage.id}`} className="font-display text-xl font-bold">
                        {stage.title}
                        <span className="ml-2 text-base font-semibold text-muted-foreground">
                            {stage.titleVi}
                        </span>
                    </h2>
                    {stage.descriptionVi && (
                        <p className="text-sm text-muted-foreground">{stage.descriptionVi}</p>
                    )}
                </div>
            </header>

            {comingSoon ? (
                <p className="ml-1 rounded-2xl border-2 border-dashed border-border bg-card/40 px-4 py-3 text-sm text-muted-foreground">
                    Coming soon
                </p>
            ) : (
                <ol className="relative space-y-3">
                    {/* The trail joining the unit nodes. */}
                    <span
                        aria-hidden
                        className="absolute bottom-8 left-6 top-8 w-0.5 -translate-x-1/2 bg-border"
                    />
                    {stage.units.map((unit) => (
                        <li key={unit.id} className="relative">
                            <UnitNode
                                unit={unit}
                                progress={progress.get(unit.id)}
                                current={unit.id === currentUnitId}
                            />
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}

function UnitNode({
    unit,
    progress,
    current,
}: Readonly<{
    unit: PathTreeUnit;
    progress: PathUnitProgress | undefined;
    current: boolean;
}>) {
    const state: PathNodeState = progress?.state ?? "locked";
    const done = progress?.lessons.filter((l) => l.state === "completed").length ?? 0;
    const percent = Math.round(unitCompletion(progress) * 100);
    const locked = state === "locked";

    const body = (
        <div
            className={cn(
                "flex items-center gap-4 rounded-2xl border-2 bg-card p-3 pr-4 transition-colors sm:p-4",
                current ? "border-primary/50 shadow-md" : "border-border",
                !locked && "hover:border-primary/40",
                locked && "opacity-70",
            )}
        >
            <PathNodeBadge state={state} label={unit.order} current={current} />
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Unit {unit.order}
                    {current && <span className="ml-2 text-primary">Up next</span>}
                </p>
                <h3 className="truncate font-display text-base font-bold sm:text-lg">
                    {unit.title}
                </h3>
                <p className="truncate text-sm text-muted-foreground">{unit.titleVi}</p>
                {!locked && (
                    <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 max-w-40 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                            {done}/{unit.lessons.length}
                        </span>
                    </div>
                )}
            </div>
            {!locked && (
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            )}
        </div>
    );

    if (locked) {
        return (
            <div aria-label={`Unit ${unit.order}: ${unit.title}, locked`}>{body}</div>
        );
    }

    return (
        <Bounce>
            <Link
                href={pathUnitHref(unit.id)}
                className="block rounded-2xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
                {body}
            </Link>
        </Bounce>
    );
}
