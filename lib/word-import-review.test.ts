import { describe, expect, it } from "vitest";
import { lessonRoom, lookupCounts, matchesFilter, reviewImport, wordCount } from "@/lib/word-import-review";
import type { ImportWordRow } from "@/lib/word-import";

let id = 0;
const row = (word: string, meaning = "nghĩa", extra: Partial<ImportWordRow> = {}): ImportWordRow => ({
    id: `r${++id}`,
    word,
    meaning,
    pronunciation: "",
    partOfSpeech: "",
    audioUrl: "",
    imageUrl: "",
    examples: [],
    ...extra,
});

describe("reviewImport", () => {
    it("marks words ready in order", () => {
        const rows = [row("cat"), row("dog")];
        const review = reviewImport(rows);
        expect(review.importable.map((r) => r.word)).toEqual(["cat", "dog"]);
        expect(review.counts.ready).toBe(2);
    });

    it("flags a word without a meaning", () => {
        const blank = row("cat", "  ");
        expect(reviewImport([blank]).status[blank.id]).toBe("needs-meaning");
    });

    it("keeps the first of a repeated word and flags the rest, ignoring case and spacing", () => {
        const a = row("Cat");
        const b = row(" cat ");
        const review = reviewImport([a, b]);
        expect(review.status[a.id]).toBe("ready");
        expect(review.status[b.id]).toBe("duplicate");
    });

    it("flags a word the lesson already has, unless kept on purpose", () => {
        const a = row("cat");
        const b = row("dog", "chó", { keepDuplicate: true });
        const review = reviewImport([a, b], { existingWords: ["CAT", "dog"] });
        expect(review.status[a.id]).toBe("in-lesson");
        expect(review.status[b.id]).toBe("ready");
    });

    it("lets a skipped row stop counting as the first of a pair", () => {
        const a = row("cat", "mèo", { skipped: true });
        const b = row("cat");
        const review = reviewImport([a, b]);
        expect(review.status[a.id]).toBe("skipped");
        expect(review.status[b.id]).toBe("ready");
    });

    it("stops at the room left in the lesson", () => {
        const rows = [row("a"), row("b", ""), row("c"), row("d")];
        const review = reviewImport(rows, { remaining: 2 });
        expect(rows.map((r) => review.status[r.id])).toEqual(["ready", "needs-meaning", "ready", "over-limit"]);
        expect(review.importable).toHaveLength(2);
        expect(review.counts["over-limit"]).toBe(1);
    });
});

describe("helpers", () => {
    it("filters by status group", () => {
        expect(matchesFilter("duplicate", "attention")).toBe(true);
        expect(matchesFilter("ready", "attention")).toBe(false);
        expect(matchesFilter("skipped", "skipped")).toBe(true);
        expect(matchesFilter("over-limit", "all")).toBe(true);
    });

    it("counts lookups by outcome", () => {
        const counts = lookupCounts([
            row("a", "", { lookup: "found" }),
            row("b", "", { lookup: "not-found" }),
            row("c", "", { lookup: "failed" }),
            row("d"),
        ]);
        expect(counts).toEqual({ found: 1, notFound: 1, failed: 1, done: 3, total: 4 });
    });

    it("works out the room left in a lesson", () => {
        expect(lessonRoom({ maxWords: 10, words: [1, 2, 3] })).toBe(7);
        expect(lessonRoom({ maxWords: 2, words: [1, 2, 3] })).toBe(0);
        expect(lessonRoom({ maxWords: null })).toBeNull();
        expect(lessonRoom(undefined)).toBeNull();
    });

    it("says word or words", () => {
        expect(wordCount(1)).toBe("1 word");
        expect(wordCount(12)).toBe("12 words");
    });
});
