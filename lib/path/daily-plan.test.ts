import { describe, expect, it } from "vitest";
import { buildDailyPlan, nextDailyStep } from "@/lib/path/daily-plan";
import type { PathMe, PathNodeState, PathTree } from "@/types/path/path.type";

const lesson = (id: string, order: number) => ({
    id,
    slug: id,
    order,
    title: `Lesson ${id}`,
    titleVi: "",
    estimatedMinutes: 10,
    newItemCount: 8,
});

const tree: PathTree = {
    snapshotVersion: 1,
    stages: [
        {
            id: "s1",
            slug: "a1",
            cefr: "A1",
            order: 1,
            title: "Beginner",
            titleVi: "",
            units: [
                { id: "u1", slug: "u1", order: 1, title: "Family", titleVi: "", canDo: [], lessons: [lesson("l1", 1), lesson("l2", 2)], checkpointId: "c1" },
                { id: "u2", slug: "u2", order: 2, title: "Food", titleVi: "", canDo: [], lessons: [lesson("l3", 1)], checkpointId: "c2" },
            ],
        },
    ],
};

function me({
    enrolled = true,
    currentLessonId = null as string | null,
    checkpoint = "locked" as PathNodeState,
} = {}): PathMe {
    return {
        enrolled,
        enrolledAt: enrolled ? "2026-09-01T00:00:00Z" : null,
        startUnitId: null,
        release: { id: "r1", version: 1 },
        progress: {
            currentLessonId,
            completedLessonCount: 0,
            totalLessonCount: 3,
            units: [
                {
                    unitId: "u1",
                    state: "available",
                    lessons: [
                        { lessonId: "l1", state: "completed" },
                        { lessonId: "l2", state: currentLessonId === "l2" ? "available" : "completed" },
                    ],
                    checkpoint: { checkpointId: "c1", state: checkpoint },
                },
                { unitId: "u2", state: "locked", lessons: [{ lessonId: "l3", state: "locked" }], checkpoint: { checkpointId: "c2", state: "locked" } },
            ],
        },
    };
}

describe("buildDailyPlan", () => {
    it("is empty before enrolling", () => {
        expect(buildDailyPlan({ tree, me: me({ enrolled: false }), dueSessionCount: 5 })).toEqual([]);
    });

    it("puts due reviews before the next lesson", () => {
        const plan = buildDailyPlan({ tree, me: me({ currentLessonId: "l2" }), dueSessionCount: 7 });
        expect(plan.map((s) => s.kind)).toEqual(["review", "lesson"]);
        expect(plan[0]).toMatchObject({ count: 7, done: false, href: "/path/review" });
        expect(plan[1]).toMatchObject({ lessonId: "l2", unitTitle: "Family", href: "/path/lesson/l2" });
        expect(nextDailyStep(plan)?.kind).toBe("review");
    });

    it("moves on to the lesson once nothing is due", () => {
        const plan = buildDailyPlan({ tree, me: me({ currentLessonId: "l2" }), dueSessionCount: 0 });
        expect(plan[0]).toMatchObject({ kind: "review", done: true });
        expect(nextDailyStep(plan)?.kind).toBe("lesson");
    });

    it("leaves reviews out while the due count is unknown", () => {
        const plan = buildDailyPlan({ tree, me: me({ currentLessonId: "l2" }), dueSessionCount: undefined });
        expect(plan.map((s) => s.kind)).toEqual(["lesson"]);
    });

    it("offers the unit test when every open lesson is done", () => {
        const plan = buildDailyPlan({ tree, me: me({ checkpoint: "available" }), dueSessionCount: 0 });
        expect(plan[1]).toMatchObject({ kind: "checkpoint", unitId: "u1", href: "/path/checkpoint/u1" });
        expect(nextDailyStep(plan)?.kind).toBe("checkpoint");
    });

    it("has nothing next when all is done", () => {
        const plan = buildDailyPlan({ tree, me: me({ checkpoint: "completed" }), dueSessionCount: 0 });
        expect(plan.map((s) => s.kind)).toEqual(["review"]);
        expect(nextDailyStep(plan)).toBeNull();
    });
});
