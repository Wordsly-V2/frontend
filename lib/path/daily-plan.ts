import { findLesson, pathCheckpointHref, pathLessonHref, PATH_REVIEW_HREF } from "@/lib/path/path-tree";
import type { PathMe, PathTree, PathTreeUnit } from "@/types/path/path.type";

/**
 * Today on the path: review what FSRS says is due, then learn something new.
 * Reviews come first so new material never crowds out forgetting-prevention.
 *
 * Derived from the current state only (the server keeps no per-day log of
 * lessons), so a step is "done" when there is nothing left to do for it now.
 */
export type DailyStep =
    | { kind: "review"; count: number; done: boolean; href: string }
    | { kind: "lesson"; lessonId: string; title: string; unitTitle: string; minutes: number; href: string }
    | { kind: "checkpoint"; unitId: string; unitTitle: string; href: string };

export interface DailyPlanInput {
    tree: PathTree;
    me: PathMe;
    /** Items the next review session would hold; undefined while unknown (offline). */
    dueSessionCount: number | undefined;
}

/** The first unit whose unit test is open and not passed yet. */
function openCheckpointUnit(tree: PathTree, me: PathMe): PathTreeUnit | null {
    const available = new Set(
        me.progress.units
            .filter((unit) => unit.checkpoint?.state === "available")
            .map((unit) => unit.unitId),
    );
    for (const stage of tree.stages) {
        for (const unit of stage.units) {
            if (available.has(unit.id)) return unit;
        }
    }
    return null;
}

export function buildDailyPlan({ tree, me, dueSessionCount }: DailyPlanInput): DailyStep[] {
    if (!me.enrolled) return [];
    const steps: DailyStep[] = [];

    if (dueSessionCount !== undefined) {
        steps.push({ kind: "review", count: dueSessionCount, done: dueSessionCount === 0, href: PATH_REVIEW_HREF });
    }

    const next = findLesson(tree, me.progress.currentLessonId);
    if (next) {
        steps.push({
            kind: "lesson",
            lessonId: next.lesson.id,
            title: next.lesson.title,
            unitTitle: next.unit.title,
            minutes: next.lesson.estimatedMinutes,
            href: pathLessonHref(next.lesson.id),
        });
    } else {
        // Every open lesson is done: the unit test is what opens the next unit.
        const unit = openCheckpointUnit(tree, me);
        if (unit) {
            steps.push({ kind: "checkpoint", unitId: unit.id, unitTitle: unit.title, href: pathCheckpointHref(unit.id) });
        }
    }

    return steps;
}

/** What to do now: the first step that isn't done, or null when the day is clear. */
export function nextDailyStep(plan: readonly DailyStep[]): DailyStep | null {
    return plan.find((step) => step.kind !== "review" || !step.done) ?? null;
}
