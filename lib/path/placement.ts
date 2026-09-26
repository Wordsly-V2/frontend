import { findUnit, type LocatedUnit } from "@/lib/path/path-tree";
import type {
    PathPlacementResponse,
    PathPlacementResult,
    PathTree,
} from "@/types/path/path.type";

/**
 * Client half of the placement test. Grading is the server's
 * (curriculum-service `placement.logic.ts`); this only shapes what is sent and
 * what the result screen says.
 */

/** Every question gets an answer: the ones never reached are null (not answered). */
export function padPlacementAnswers(
    responses: readonly PathPlacementResponse[],
    total: number,
): PathPlacementResponse[] {
    return Array.from({ length: total }, (_, i) => responses[i] ?? null);
}

export interface PlacementOutcome {
    /** Where the learner starts now; null = the very first unit. */
    start: LocatedUnit | null;
    /** The test placed them before a start they already had, which stays. */
    keptLaterStart: boolean;
    /** Units the learner now skips (counted as done). */
    skippedUnitCount: number;
}

export function placementOutcome(
    tree: PathTree | null | undefined,
    result: Pick<PathPlacementResult, "placedUnitId" | "startUnitId" | "skippedUnitIds">,
): PlacementOutcome {
    const start = findUnit(tree, result.startUnitId);
    const units = tree?.stages.flatMap((stage) => stage.units.map((unit) => unit.id)) ?? [];
    const startIndex = start ? units.indexOf(start.unit.id) : 0;
    return {
        start,
        keptLaterStart: result.startUnitId !== result.placedUnitId,
        skippedUnitCount: Math.max(startIndex, result.skippedUnitIds.length),
    };
}
