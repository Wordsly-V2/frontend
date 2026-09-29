import { describe, expect, it } from "vitest";
import {
    emptyStepForm,
    recordToStepForm,
    stepFormSchema,
    stepFormToRecord,
    stepSummary,
    templateSlots,
} from "@/lib/admin-path/step-forms";

// One step of each type, as the admin API returns them (seed shape, from a2-02-l3).
const steps = [
    { type: "WARMUP", payload: { schemaVersion: 1, maxItems: 10 } },
    { type: "INTRO", payload: { schemaVersion: 1, items: ["did-you", "nothing-special", "took"] } },
    {
        type: "EXPLAIN",
        payload: {
            schemaVersion: 1,
            titleVi: "Hỏi và phủ định: did / didn't",
            bodyVi: "Quá khứ dùng **did**.\n\n| | hiện tại | quá khứ |\n|---|---|---|",
            items: ["past-simple-did", "did-you"],
            examples: [
                { en: "Did you go out? No, I didn't.", vi: "Bạn có đi chơi không? Không.", highlight: "No, I didn't" },
                { en: "We walked.", vi: "Bọn mình đi bộ." },
            ],
        },
    },
    { type: "EXPLAIN", payload: { schemaVersion: 1, titleVi: "Ghi chú", bodyVi: "Không có ví dụ." } },
    {
        type: "PATTERN_DRILL",
        payload: {
            schemaVersion: 1,
            pattern: "did-you",
            prompts: [
                { cueVi: "Hỏi: tối qua bạn có đi chơi không?", slots: { do: "go out last night" }, answer: "Did you go out last night?" },
                { cueVi: "Không có chỗ trống.", slots: {}, answer: "Did you?" },
            ],
        },
    },
    { type: "PRACTICE", payload: { schemaVersion: 1, modes: ["word-bank", "flashcard", "context"], items: ["took", "went"] } },
    { type: "DIALOGUE", payload: { schemaVersion: 1, dialogue: "a2-02-did-you-have-a-good-weekend", mode: "listen" } },
    { type: "SPEAK", payload: { schemaVersion: 1, lines: [{ en: "Last weekend was great.", vi: "Cuối tuần vừa rồi rất tuyệt." }] } },
    {
        type: "QUIZ",
        payload: {
            schemaVersion: 1,
            questions: [
                { kind: "choice", prompt: "Câu nào đúng?", options: ["I didn't went.", "I didn't go."], answer: 1, item: "past-simple-did" },
                { kind: "gap", sentence: "___ you have a good weekend?", answers: ["Did"] },
                { kind: "order", vi: "Không có gì đặc biệt.", answer: "Nothing special." },
            ],
        },
    },
];

describe("step forms", () => {
    it("round-trips every step type unchanged, so saving is a no-op", () => {
        for (const step of steps) {
            const form = recordToStepForm(step);
            expect(stepFormSchema.safeParse(form).error?.issues ?? []).toEqual([]);
            expect(stepFormToRecord(form)).toEqual(step);
        }
    });

    it("keeps the order of items and modes, and drops empty optional fields", () => {
        const form = recordToStepForm(steps[2]);
        form.items = [];
        form.examples[0].highlight = " ";
        const payload = stepFormToRecord(form).payload as Record<string, unknown>;
        expect(payload.items).toBeUndefined();
        expect(payload.examples).toEqual([{ en: "Did you go out? No, I didn't.", vi: "Bạn có đi chơi không? Không." }, { en: "We walked.", vi: "Bọn mình đi bộ." }]);
        expect((stepFormToRecord(recordToStepForm(steps[5])).payload as { modes: string[] }).modes).toEqual(["word-bank", "flashcard", "context"]);
    });

    it("checks only the chosen type's fields", () => {
        const quiz = recordToStepForm(steps[8]);
        quiz.questions[0].answer = "";
        expect(stepFormSchema.safeParse(quiz).error?.issues.map((i) => i.path.join("."))).toEqual(["questions.0.answer"]);
        // Switched away from the quiz: its unfinished questions don't block saving.
        expect(stepFormSchema.safeParse({ ...quiz, type: "SPEAK", lines: [{ en: "Hi.", vi: "Chào." }] }).success).toBe(true);
    });

    it("refuses what the server would", () => {
        const issues = (form: ReturnType<typeof emptyStepForm>) => stepFormSchema.safeParse(form).error?.issues.map((i) => i.path.join("."));
        expect(issues(emptyStepForm("INTRO"))).toEqual(["items"]);
        expect(issues({ ...emptyStepForm("PRACTICE"), items: [{ slug: "took" }], modes: [] })).toEqual(["modes"]);
        expect(issues({ ...emptyStepForm("WARMUP"), maxItems: "31" })).toEqual(["maxItems"]);
        const explain = recordToStepForm(steps[2]);
        explain.examples[1].highlight = "run";
        expect(issues(explain)).toEqual(["examples.1.highlight"]);
        const drill = recordToStepForm(steps[4]);
        drill.prompts[1].slots = [{ name: "do", value: "a" }, { name: "do", value: "b" }];
        expect(issues(drill)).toEqual(["prompts.1.slots.1.name"]);
        expect(issues(emptyStepForm("DIALOGUE"))).toEqual(["dialogue"]);
        expect(issues(emptyStepForm("QUIZ"))).toEqual(["questions"]);
    });

    it("reads slot names from a template, and sums a step up", () => {
        expect(templateSlots("I'd like {thing}, please, {thing} and {when}.")).toEqual(["thing", "when"]);
        expect(stepSummary(recordToStepForm(steps[4]))).toBe("did-you · 2 prompts");
        expect(stepSummary(recordToStepForm(steps[8]))).toBe("3 questions");
    });
});
