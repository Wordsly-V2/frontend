import { describe, expect, it } from "vitest";
import { buildPathClozePrompts, pathAnswerText } from "@/lib/path/item-context";
import type { PathDialogue, PathItem } from "@/types/path/path.type";

const item = (over: Partial<PathItem>): PathItem => ({
    id: "i1",
    slug: "i1",
    type: "PHRASE",
    text: "What's your name?",
    meaningVi: "Bạn tên là gì?",
    examples: [
        { en: "Hi! What's your name?", vi: "Chào bạn! Bạn tên là gì?", highlight: "What's your name?" },
    ],
    ...over,
});

const firstDay: PathDialogue = {
    id: "d1",
    slug: "pre-a1-01-first-day",
    title: "First day at class",
    situationVi: "Buổi học đầu tiên, bạn gặp một bạn cùng lớp.",
    lines: [
        { speaker: "Tom", en: "Hi! What's your name?", vi: "Chào bạn! Bạn tên là gì?" },
        { speaker: "You", en: "Hello. My name is Lan.", vi: "Xin chào. Mình tên là Lan.", learnerTurn: true },
        { speaker: "Tom", en: "Nice to meet you, Lan. I'm Tom.", vi: "Rất vui được gặp bạn, Lan. Mình là Tom." },
    ],
};

describe("buildPathClozePrompts", () => {
    it("sets a phrase in the dialogue turn that uses it, with the reply after it", () => {
        const [prompt, ...rest] = buildPathClozePrompts(item({}), [firstDay]);
        expect(rest).toHaveLength(0);
        expect(prompt.sentence).toBe("Hi! _____");
        expect(prompt.answer).toBe("What's your name?");
        expect(prompt.example.text).toBe("Hi! What's your name?");
        expect(prompt.context).toEqual({
            situationVi: firstDay.situationVi,
            translationVi: "Chào bạn! Bạn tên là gì?",
            lines: [
                { speaker: "Tom", en: "Hi! _____", target: true },
                { speaker: "You", en: "Hello. My name is Lan." },
            ],
        });
    });

    it("falls back to the example with its translation as the clue", () => {
        const prompts = buildPathClozePrompts(item({}));
        expect(prompts).toHaveLength(1);
        expect(prompts[0].sentence).toBe("Hi! _____");
        expect(prompts[0].context).toEqual({ translationVi: "Chào bạn! Bạn tên là gì?" });
    });

    it("blanks the highlighted form when the sentence doesn't use the item as written", () => {
        const [prompt] = buildPathClozePrompts(
            item({
                type: "LEXICAL",
                text: "rise",
                examples: [{ en: "Prices rose last year.", vi: "Giá đã tăng năm ngoái.", highlight: "rose" }],
            }),
        );
        expect(prompt.sentence).toBe("Prices _____ last year.");
        expect(prompt.answer).toBe("rose");
    });

    it("drops the ellipsis of a frame before matching", () => {
        const [prompt] = buildPathClozePrompts(
            item({
                text: "by the end of …",
                examples: [{ en: "Finish it by the end of the week.", vi: "Làm xong trước cuối tuần." }],
            }),
        );
        expect(prompt.sentence).toBe("Finish it _____ the week.");
        expect(prompt.answer).toBe("by the end of");
    });

    it("matches whole words only", () => {
        const prompts = buildPathClozePrompts(
            item({ type: "LEXICAL", text: "hi", examples: [{ en: "This is his book.", vi: "" }] }),
        );
        expect(prompts).toEqual([]);
    });

    it("skips a dialogue with a single line", () => {
        const lone = { ...firstDay, lines: firstDay.lines.slice(0, 1) };
        const [prompt] = buildPathClozePrompts(item({}), [lone]);
        expect(prompt.context?.lines).toBeUndefined();
    });

    it("is empty when neither a dialogue nor an example uses the item", () => {
        expect(buildPathClozePrompts(item({ examples: [] }), [firstDay].slice(1))).toEqual([]);
    });
});

describe("pathAnswerText", () => {
    it("strips a leading or trailing ellipsis", () => {
        expect(pathAnswerText("What's more, …")).toBe("What's more");
        expect(pathAnswerText("… is made of")).toBe("is made of");
        expect(pathAnswerText("Fair enough.")).toBe("Fair enough.");
    });
});
