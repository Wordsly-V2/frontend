import { describe, expect, it } from "vitest";
import { padPlacementAnswers, placementOutcome } from "@/lib/path/placement";
import type { PathTree } from "@/types/path/path.type";

const unit = (id: string, order: number) => ({
    id,
    slug: id,
    order,
    title: `Unit ${id}`,
    titleVi: "",
    canDo: [],
    lessons: [],
    checkpointId: null,
});

const tree: PathTree = {
    snapshotVersion: 1,
    stages: [
        { id: "s1", slug: "pre-a1", cefr: "PRE_A1", order: 1, title: "Foundations", titleVi: "", units: [unit("u1", 1), unit("u2", 2)] },
        { id: "s2", slug: "a1", cefr: "A1", order: 2, title: "Beginner", titleVi: "", units: [unit("u3", 1), unit("u4", 2)] },
    ],
};

describe("padPlacementAnswers", () => {
    it("fills the questions never reached with null", () => {
        expect(padPlacementAnswers([1, "am"], 4)).toEqual([1, "am", null, null]);
    });

    it("keeps an explicit null and never truncates", () => {
        expect(padPlacementAnswers([null, 2], 2)).toEqual([null, 2]);
    });
});

describe("placementOutcome", () => {
    it("names the start unit and its stage", () => {
        const outcome = placementOutcome(tree, {
            placedUnitId: "u3",
            startUnitId: "u3",
            skippedUnitIds: ["u1", "u2"],
        });
        expect(outcome.start?.unit.id).toBe("u3");
        expect(outcome.start?.stage.cefr).toBe("A1");
        expect(outcome.keptLaterStart).toBe(false);
        expect(outcome.skippedUnitCount).toBe(2);
    });

    it("starts at the beginning when nothing was skipped", () => {
        const outcome = placementOutcome(tree, {
            placedUnitId: null,
            startUnitId: null,
            skippedUnitIds: [],
        });
        expect(outcome).toEqual({ start: null, keptLaterStart: false, skippedUnitCount: 0 });
    });

    it("reports a later start that the test did not move back", () => {
        const outcome = placementOutcome(tree, {
            placedUnitId: "u2",
            startUnitId: "u4",
            skippedUnitIds: ["u1"],
        });
        expect(outcome.keptLaterStart).toBe(true);
        expect(outcome.start?.unit.id).toBe("u4");
        expect(outcome.skippedUnitCount).toBe(3);
    });
});
