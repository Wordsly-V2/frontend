import { describe, expect, it } from "vitest";
import { countOf, shareOf, wordGaps, wordIpa } from "@/lib/admin/vocabulary";

const complete = {
    meaning: "táo",
    ukIpa: "/ˈæp.əl/",
    audioUrl: "https://example.com/a.mp3",
    example: '[{"text":"An apple a day."}]',
};

describe("wordGaps", () => {
    it("finds nothing missing on a complete word", () => {
        expect(wordGaps(complete)).toEqual([]);
    });

    it("accepts any one of the IPA and audio fields", () => {
        expect(wordGaps({ ...complete, ukIpa: undefined, pronunciation: "æpl" })).toEqual([]);
        expect(wordGaps({ ...complete, audioUrl: undefined, usAudioUrl: "https://example.com/us.mp3" })).toEqual([]);
    });

    it("counts blanks and an empty example list as missing", () => {
        expect(
            wordGaps({ meaning: "  ", ukIpa: "", audioUrl: undefined, example: "[]" }),
        ).toEqual(["ipa", "audio", "meaning", "example"]);
    });
});

describe("wordIpa", () => {
    it("prefers UK, then US, then the plain pronunciation", () => {
        expect(wordIpa({ ukIpa: "uk", usIpa: "us", pronunciation: "p" })).toBe("uk");
        expect(wordIpa({ ukIpa: " ", usIpa: "us" })).toBe("us");
        expect(wordIpa({ pronunciation: "p" })).toBe("p");
        expect(wordIpa({})).toBeNull();
    });
});

describe("shareOf", () => {
    it("shows the count and its rounded share", () => {
        expect(shareOf(3, 40)).toBe("3 of 40 (8%)");
        expect(shareOf(0, 0)).toBe("0");
    });
});

describe("countOf", () => {
    it("picks singular for one", () => {
        expect(countOf(1, "lesson")).toBe("1 lesson");
        expect(countOf(0, "lesson")).toBe("0 lessons");
        expect(countOf(2, "learner")).toBe("2 learners");
    });
});
