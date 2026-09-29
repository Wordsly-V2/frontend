import { describe, expect, it } from "vitest";
import {
    emptyLessonForm,
    lessonFormSchema,
    lessonFormToRecord,
    recordToLessonForm,
} from "@/lib/admin-path/lesson-form";

// A lesson as the admin API returns it (seed shape).
const lesson = {
    slug: "a1-03-l2-ordering",
    title: "I'd like a coffee, please",
    titleVi: "Gọi đồ uống ở quán",
    estimatedMinutes: 12,
    items: [
        { item: "water", role: "INTRODUCE" },
        { item: "please", role: "RECYCLE" },
    ],
    steps: [
        { type: "WARMUP", payload: { schemaVersion: 1, maxItems: 8 } },
        {
            type: "PATTERN_DRILL",
            payload: {
                schemaVersion: 1,
                pattern: "id-like",
                prompts: [{ cueVi: "Gọi một ly cà phê.", slots: { thing: "a coffee" }, answer: "I'd like a coffee, please." }],
            },
        },
    ],
    unit: "a1-03-food-and-drink",
    order: 2,
};

describe("lesson form", () => {
    it("round-trips a lesson unchanged, so saving it is a no-op", () => {
        const form = recordToLessonForm(lesson);
        expect(lessonFormSchema.safeParse(form).success).toBe(true);
        expect(lessonFormToRecord(form)).toEqual(lesson);
    });

    it("starts a new lesson with one step", () => {
        const form = emptyLessonForm("u");
        expect(form.unit).toBe("u");
        expect(form.steps).toHaveLength(1);
    });

    it("refuses a step that isn't filled in, and a lesson without steps", () => {
        const form = recordToLessonForm(lesson);
        form.steps[0].maxItems = "0";
        form.steps[1].prompts[0].answer = " ";
        const bad = lessonFormSchema.safeParse(form);
        expect(bad.error?.issues.map((i) => i.path.join("."))).toEqual(["steps.0.maxItems", "steps.1.prompts.0.answer"]);
        expect(lessonFormSchema.safeParse({ ...form, steps: [] }).success).toBe(false);
    });

    it("checks the minutes range", () => {
        const form = { ...recordToLessonForm(lesson), estimatedMinutes: "0" };
        expect(lessonFormSchema.safeParse(form).success).toBe(false);
    });
});
