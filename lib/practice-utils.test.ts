import { describe, expect, it } from "vitest";
import { getAnswerMatch, gradeSentenceBuild, normalizeAnswer } from "./practice-utils";

describe("normalizeAnswer", () => {
    it("ignores case, spacing, curly apostrophes and final punctuation", () => {
        expect(normalizeAnswer("  How   are you? ")).toBe("how are you");
        expect(normalizeAnswer("Nice to meet you!!")).toBe("nice to meet you");
        expect(normalizeAnswer("I’m fine.")).toBe("i'm fine");
        expect(normalizeAnswer("Wait …")).toBe("wait");
    });

    it("keeps punctuation inside the answer", () => {
        expect(normalizeAnswer("Yes, please.")).toBe("yes, please");
    });
});

describe("getAnswerMatch", () => {
    it("treats a missing final '.' or '?' as exact", () => {
        expect(getAnswerMatch("how are you", "How are you?")).toBe("exact");
        expect(getAnswerMatch("Thank you.", "thank you")).toBe("exact");
        expect(getAnswerMatch("ok", "OK!")).toBe("exact");
    });
});

describe("gradeSentenceBuild", () => {
    it("still grades tiles that carry punctuation", () => {
        const tiles = ["How", "are", "you?"];
        expect(gradeSentenceBuild(tiles, tiles)).toBe("exact");
    });
});
