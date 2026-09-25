import type {
    CefrLevel,
    PathMe,
    PathNodeState,
    PathTree,
    PathTreeLesson,
    PathTreeStage,
    PathTreeUnit,
    PathUnitProgress,
} from "@/types/path/path.type";

export const CEFR_LABELS: Record<CefrLevel, string> = {
    PRE_A1: "Pre-A1",
    A1: "A1",
    A2: "A2",
    B1: "B1",
    B2: "B2",
    C1: "C1",
};

export const pathLessonHref = (lessonId: string) => `/path/lesson/${lessonId}`;
export const pathUnitHref = (unitId: string) => `/path/unit/${unitId}`;

/** Progress per unit id, for looking units up while walking the tree. */
export function unitProgressById(me: PathMe | undefined): Map<string, PathUnitProgress> {
    return new Map((me?.progress.units ?? []).map((unit) => [unit.unitId, unit]));
}

/** A lesson's state, or `locked` when the learner has no progress for it. */
export function lessonState(
    progress: PathUnitProgress | undefined,
    lessonId: string,
): PathNodeState {
    return (
        progress?.lessons.find((lesson) => lesson.lessonId === lessonId)?.state ??
        "locked"
    );
}

export interface LocatedLesson {
    stage: PathTreeStage;
    unit: PathTreeUnit;
    lesson: PathTreeLesson;
}

/** Finds a lesson and the unit and stage around it. */
export function findLesson(
    tree: PathTree | null | undefined,
    lessonId: string | null | undefined,
): LocatedLesson | null {
    if (!tree || !lessonId) return null;
    for (const stage of tree.stages) {
        for (const unit of stage.units) {
            const lesson = unit.lessons.find((l) => l.id === lessonId);
            if (lesson) return { stage, unit, lesson };
        }
    }
    return null;
}

/** Share of the unit's lessons done, 0–1. */
export function unitCompletion(progress: PathUnitProgress | undefined): number {
    const lessons = progress?.lessons ?? [];
    if (lessons.length === 0) return 0;
    return lessons.filter((l) => l.state === "completed").length / lessons.length;
}
