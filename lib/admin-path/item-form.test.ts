import { describe, expect, it } from "vitest";
import {
    emptyItemForm,
    itemFormSchema,
    itemFormToRecord,
    recordToItemForm,
} from "@/lib/admin-path/item-form";

// Shapes copied from the seed (content/units/a1/a1-03-food-and-drink.json).
const lexical = {
    slug: "rice",
    type: "LEXICAL",
    text: "rice",
    meaningVi: "cơm, gạo",
    ipa: "/raɪs/",
    examples: [{ en: "We eat rice every day.", vi: "Nhà mình ăn cơm hằng ngày.", highlight: "rice" }],
    noteVi: "Danh từ không đếm được.",
    unit: "a1-03-food-and-drink",
};
const pattern = {
    slug: "id-like",
    type: "PATTERN",
    text: "I'd like …, please.",
    meaningVi: "Cho tôi …",
    examples: [{ en: "I'd like a tea, please.", vi: "Cho mình một ly trà.", highlight: "I'd like" }],
    pattern: {
        template: "I'd like {thing}, please.",
        slots: [{ name: "thing", hintVi: "món", options: ["a coffee", "some water"] }],
    },
    unit: "a1-03-food-and-drink",
};
const grammar = {
    slug: "a-an",
    type: "GRAMMAR",
    text: "a / an",
    meaningVi: "mạo từ",
    examples: [],
    grammar: {
        ruleVi: "a trước phụ âm, an trước nguyên âm.",
        forms: [{ label: "a", example: "a book" }],
        pitfallsVi: ["an university", "a apple"],
    },
    collocations: ["a lot"],
    unit: "pre-a1-04-about-me",
};

describe("item form", () => {
    it.each([
        ["a word", lexical],
        ["a pattern", pattern],
        ["a grammar point", grammar],
    ])("round-trips %s unchanged, so saving it is a no-op", (_label, record) => {
        const form = recordToItemForm(record);
        expect(itemFormSchema.safeParse(form).success).toBe(true);
        expect(itemFormToRecord(form)).toEqual(record);
    });

    it("drops empty optional fields instead of sending empty strings", () => {
        const form = { ...emptyItemForm("u"), slug: "x", text: "x", meaningVi: "x", examples: [] };
        expect(itemFormToRecord(form)).toEqual({
            slug: "x",
            unit: "u",
            type: "LEXICAL",
            text: "x",
            meaningVi: "x",
            examples: [],
        });
    });

    it("keeps a pattern's slots only for patterns", () => {
        const form = { ...recordToItemForm(pattern), type: "PHRASE" as const };
        expect(itemFormToRecord(form)).not.toHaveProperty("pattern");
    });

    it("checks what the server would refuse", () => {
        const bad = recordToItemForm({ ...pattern, slug: "Bad Slug" });
        bad.pattern.slots[0].name = "other";
        bad.examples[0].highlight = "not there";
        const result = itemFormSchema.safeParse(bad);
        expect(result.success).toBe(false);
        const paths = result.error!.issues.map((i) => i.path.join("."));
        expect(paths).toEqual(
            expect.arrayContaining(["slug", "pattern.slots.0.name", "examples.0.highlight"]),
        );
    });
});
