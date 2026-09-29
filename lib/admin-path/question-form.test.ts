import { describe, expect, it } from "vitest";
import {
    checkpointFormSchema,
    checkpointFormToRecord,
    emptyCheckpointForm,
    emptyQuestionForm,
    orderTiles,
    placementFormSchema,
    placementFormToRecord,
    placementWarnings,
    questionFormSchema,
    recordToCheckpointForm,
    recordToPlacementForm,
    recordToQuestionForm,
} from "@/lib/admin-path/question-form";

// Shapes copied from the seed (a1-03-food-and-drink checkpoint, content/placement.json).
const checkpoint = {
    slug: "a1-03-checkpoint",
    unit: "a1-03-food-and-drink",
    passPercent: 70,
    questions: [
        {
            kind: "choice",
            prompt: "Ở quán, bạn muốn gọi nước cam. Bạn nói:",
            options: ["Give me orange juice.", "I'd like an orange juice, please.", "I want juice."],
            answer: 1,
            item: "id-like",
        },
        { kind: "gap", sentence: "Can I ___ some water, please?", answers: ["have"], item: "can-i-have" },
    ],
};
const placement = {
    slug: "path-placement",
    title: "Placement test",
    questions: [
        {
            unit: "pre-a1-01-hello",
            kind: "choice",
            prompt: "Nghe và chọn câu đáp phù hợp.",
            audioText: "How are you?",
            options: ["My name is Lan.", "Good night.", "I'm fine, thanks. And you?"],
            answer: 2,
            item: "how-are-you",
            explanationVi: "Hỏi thăm sức khỏe.",
        },
        { unit: "pre-a1-02-alphabet", kind: "order", vi: "Bạn đánh vần từ đó thế nào?", answer: "How do you spell that?", item: "how-do-you-spell" },
        { unit: "pre-a1-03-numbers", kind: "gap", sentence: "I'm twenty ___ old.", hintVi: "Tôi hai mươi tuổi.", answers: ["years"] },
    ],
};

const paths = (result: { error?: { issues: { path: PropertyKey[] }[] } }) =>
    result.error?.issues.map((i) => i.path.join(".")) ?? [];

describe("question form", () => {
    it("round-trips a unit test unchanged, so saving it is a no-op", () => {
        const form = recordToCheckpointForm(checkpoint);
        expect(checkpointFormSchema.safeParse(form).success).toBe(true);
        expect(checkpointFormToRecord(form)).toEqual(checkpoint);
    });

    it("round-trips the placement test with each question's unit", () => {
        const form = recordToPlacementForm(placement);
        expect(placementFormSchema.safeParse(form).success).toBe(true);
        expect(placementFormToRecord(form)).toEqual(placement);
    });

    it("keeps only the chosen kind's fields", () => {
        const form = { ...recordToQuestionForm(checkpoint.questions[0]), kind: "order" as const, vi: "Cho tôi nước.", orderAnswer: " Water, please. " };
        expect(checkpointFormToRecord({ ...recordToCheckpointForm(checkpoint), questions: [form] }).questions).toEqual([
            { kind: "order", vi: "Cho tôi nước.", answer: "Water, please.", item: "id-like" },
        ]);
    });

    it("needs a picked answer among 2 to 6 options", () => {
        const q = emptyQuestionForm("choice");
        expect(paths(questionFormSchema.safeParse({ ...q, prompt: "p", options: [{ text: "a" }] }))).toEqual(["options", "answer"]);
        const ok = { ...q, prompt: "p", options: [{ text: "a" }, { text: "b" }], answer: "1" };
        expect(questionFormSchema.safeParse(ok).success).toBe(true);
        expect(paths(questionFormSchema.safeParse({ ...ok, answer: "2" }))).toEqual(["answer"]);
    });

    it("needs exactly one ___ gap and an accepted answer", () => {
        const q = { ...emptyQuestionForm("gap"), answers: [{ text: "x" }] };
        for (const sentence of ["No gap.", "Two ___ and ___.", "Four ____ here."]) {
            expect(paths(questionFormSchema.safeParse({ ...q, sentence }))).toEqual(["sentence"]);
        }
        expect(paths(questionFormSchema.safeParse({ ...q, sentence: "A ___.", answers: [] }))).toEqual(["answers"]);
        expect(paths(questionFormSchema.safeParse({ ...q, sentence: "A ___.", item: "Not A Slug" }))).toEqual(["item"]);
    });

    it("needs the unit of a placement question", () => {
        const form = recordToPlacementForm(placement);
        form.questions[1].unit = "";
        expect(paths(placementFormSchema.safeParse(form))).toEqual(["questions.1.unit"]);
    });

    it("starts a unit test for the given unit", () => {
        expect(emptyCheckpointForm("u1")).toMatchObject({ slug: "u1-checkpoint", unit: "u1", passPercent: "70" });
    });

    it("shows the tiles of an order question", () => {
        expect(orderTiles("  How do  you spell that? ")).toEqual(["How", "do", "you", "spell", "that?"]);
    });

    it("warns about thin units and questions out of path order", () => {
        const order = ["u1", "u2", "u3"];
        expect(placementWarnings([{ unit: "u1" }, { unit: "u1" }, { unit: "u2" }, { unit: "u2" }], order)).toEqual([]);
        expect(placementWarnings([{ unit: "u2" }, { unit: "u2" }, { unit: "u1" }], order)).toEqual([
            "u1 has only 1 question; each probed unit needs at least 2.",
            "Question 3 (u1) comes after a later unit; keep questions in path order.",
        ]);
    });
});
