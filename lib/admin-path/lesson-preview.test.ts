import { describe, expect, it } from "vitest";
import { buildLessonPreview, lessonPreviewRefs } from "@/lib/admin-path/lesson-preview";

const lesson = {
    slug: "a1-03-l2",
    unit: "a1-03",
    order: 2,
    title: "I'd like a coffee",
    titleVi: "Gọi đồ uống",
    estimatedMinutes: 12,
    items: [
        { item: "coffee", role: "INTRODUCE" },
        { item: "id-like", role: "RECYCLE" },
    ],
    steps: [
        { type: "WARMUP", payload: { schemaVersion: 1, maxItems: 8 } },
        { type: "INTRO", payload: { schemaVersion: 1, items: ["coffee"] } },
        { type: "EXPLAIN", payload: { schemaVersion: 1, titleVi: "Lịch sự", bodyVi: "Dùng *please*." } },
        {
            type: "PATTERN_DRILL",
            payload: {
                schemaVersion: 1,
                pattern: "id-like",
                prompts: [{ cueVi: "Gọi cà phê.", slots: { thing: "a coffee" }, answer: "I'd like a coffee." }],
            },
        },
        { type: "DIALOGUE", payload: { schemaVersion: 1, mode: "listen", dialogue: "at-the-cafe" } },
        {
            type: "QUIZ",
            payload: {
                schemaVersion: 1,
                questions: [{ kind: "gap", sentence: "I'd like a ___.", answers: ["coffee"], item: "coffee" }],
            },
        },
    ],
};

const items = new Map([
    ["coffee", { slug: "coffee", type: "LEXICAL", text: "coffee", meaningVi: "cà phê", examples: [], unit: "a1-03" }],
    [
        "id-like",
        {
            slug: "id-like",
            type: "PATTERN",
            text: "I'd like …",
            meaningVi: "Tôi muốn …",
            examples: [],
            pattern: { template: "I'd like {thing}.", slots: [{ name: "thing", hintVi: "đồ", options: ["a coffee"] }] },
            unit: "a1-03",
        },
    ],
]);
const dialogues = new Map([
    ["at-the-cafe", { slug: "at-the-cafe", title: "At the café", situationVi: "Ở quán", lines: [{ speaker: "A", en: "Hi", vi: "Chào" }], unit: "a1-03" }],
]);

describe("lesson preview", () => {
    it("lists what to load", () => {
        expect(lessonPreviewRefs(lesson)).toEqual({ items: ["coffee", "id-like"], dialogues: ["at-the-cafe"] });
    });

    it("builds the lesson the player takes, references resolved by slug", () => {
        const { lesson: built, missing } = buildLessonPreview(lesson, items, dialogues);
        expect(missing).toEqual([]);
        expect(built.items.map((i) => [i.id, i.role])).toEqual([
            ["coffee", "INTRODUCE"],
            ["id-like", "RECYCLE"],
        ]);
        expect(built.items[0]).not.toHaveProperty("unit");
        expect(built.steps.map((s) => s.id)).toEqual([0, 1, 2, 3, 4, 5].map((i) => `a1-03-l2#${i}`));
        expect(built.steps[1].payload).toEqual({ schemaVersion: 1, itemIds: ["coffee"] });
        expect(built.steps[2].payload).not.toHaveProperty("itemIds");
        expect(built.steps[3].payload).toMatchObject({ patternId: "id-like" });
        expect(built.steps[4].payload).toMatchObject({ mode: "listen", dialogue: { id: "at-the-cafe", title: "At the café" } });
        expect(built.steps[5].payload).toEqual({
            schemaVersion: 1,
            questions: [{ kind: "gap", sentence: "I'd like a ___.", answers: ["coffee"], itemId: "coffee" }],
        });
    });

    it("reports references that don't resolve and drops a dialogue it can't find", () => {
        const { lesson: built, missing } = buildLessonPreview(lesson, new Map([["coffee", items.get("coffee")!]]), new Map());
        expect(missing).toEqual(["item id-like", "dialogue at-the-cafe"]);
        expect(built.items.map((i) => i.id)).toEqual(["coffee"]);
        expect(built.steps.some((s) => s.type === "DIALOGUE")).toBe(false);
    });
});
