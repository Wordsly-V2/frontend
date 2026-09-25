import { describe, expect, it } from "vitest";
import {
    accuracyToQuality,
    normalizeSpeech,
    numberToWords,
    scoreSpeech,
} from "@/lib/speech-scoring";
import { isCorrectAnswer } from "@/lib/answer-quality";
import { AnswerQuality } from "@/types/word-progress/word-progress.type";

describe("normalizeSpeech", () => {
    it("ignores case, punctuation and curly apostrophes", () => {
        expect(normalizeSpeech("Hello, this is Lan!")).toEqual(["hello", "this", "is", "lan"]);
        expect(normalizeSpeech("I’m fine")).toEqual(normalizeSpeech("I'm fine"));
    });

    it("expands contractions the same way on both sides", () => {
        expect(normalizeSpeech("I'm")).toEqual(["i", "am"]);
        expect(normalizeSpeech("It's")).toEqual(normalizeSpeech("it is"));
        expect(normalizeSpeech("don't")).toEqual(["do", "not"]);
        expect(normalizeSpeech("can't")).toEqual(["can", "not"]);
        expect(normalizeSpeech("won't")).toEqual(["will", "not"]);
        expect(normalizeSpeech("Let's meet")).toEqual(["let", "us", "meet"]);
    });

    it("spells out digits and clock times", () => {
        expect(normalizeSpeech("7:00")).toEqual(normalizeSpeech("seven o'clock"));
        expect(normalizeSpeech("7:30")).toEqual(["seven", "thirty"]);
        expect(normalizeSpeech("50,000 dong")).toEqual(["fifty", "thousand", "dong"]);
        expect(normalizeSpeech("I'm 25")).toEqual(["i", "am", "twenty", "five"]);
    });

    it("splits hyphenated words", () => {
        expect(normalizeSpeech("a T-shirt")).toEqual(["a", "t", "shirt"]);
        expect(normalizeSpeech("twenty-first")).toEqual(["twenty", "first"]);
    });
});

describe("numberToWords", () => {
    it.each([
        [0, "zero"],
        [13, "thirteen"],
        [40, "forty"],
        [99, "ninety nine"],
        [105, "one hundred five"],
        [250, "two hundred fifty"],
        [2026, "two thousand twenty six"],
        [500000, "five hundred thousand"],
    ])("%i → %s", (n, words) => {
        expect(numberToWords(n)).toBe(words);
    });
});

describe("scoreSpeech", () => {
    it("is null when nothing was heard", () => {
        expect(scoreSpeech("Hello.", [])).toBeNull();
        expect(scoreSpeech("Hello.", ["  "])).toBeNull();
    });

    it("gives a perfect score to the sentence however it was written", () => {
        const score = scoreSpeech("I'm eating lunch right now.", ["I am eating lunch right now"]);
        expect(score?.accuracy).toBe(1);
        expect(score?.quality).toBe(AnswerQuality.PERFECT);
        expect(score?.words.every((w) => w.matched)).toBe(true);
    });

    it("accepts the recogniser's digits for spoken numbers", () => {
        expect(scoreSpeech("Let's meet at seven o'clock.", ["let's meet at 7:00"])?.accuracy).toBe(1);
    });

    it("counts a wrong word as one mistake and flags it", () => {
        const score = scoreSpeech("I usually walk to work.", ["I usually work to work"]);
        expect(score?.accuracy).toBeCloseTo(4 / 5);
        expect(score?.words.map((w) => w.matched)).toEqual([true, true, false, true, true]);
    });

    it("counts missing and extra words", () => {
        expect(scoreSpeech("Can I pay by card?", ["can I pay card"])?.accuracy).toBeCloseTo(4 / 5);
        expect(scoreSpeech("Turn left.", ["turn to the left"])?.accuracy).toBe(0);
    });

    it("marks a contraction matched only when both halves were heard", () => {
        const score = scoreSpeech("I'm fine.", ["I fine"]);
        expect(score?.words).toEqual([
            { word: "I'm", matched: false },
            { word: "fine.", matched: true },
        ]);
    });

    it("takes the best of the alternatives", () => {
        const score = scoreSpeech("Where's my key?", ["where's my tea", "where's my key"]);
        expect(score?.accuracy).toBe(1);
        expect(score?.heard).toBe("where's my key");
    });

    it("passes at the same line as isCorrectAnswer", () => {
        // 7 of 10 words right: the lowest passing score.
        const score = scoreSpeech(
            "one two three four five six seven eight nine ten",
            ["one two three four five six seven x y z"],
        );
        expect(score?.accuracy).toBeCloseTo(0.7);
        expect(isCorrectAnswer(score!.quality)).toBe(true);
        expect(isCorrectAnswer(accuracyToQuality(0.69))).toBe(false);
    });
});

describe("accuracyToQuality", () => {
    it.each([
        [1, AnswerQuality.PERFECT],
        [0.9, AnswerQuality.CORRECT_WITH_HESITATION],
        [0.75, AnswerQuality.CORRECT_WITH_DIFFICULTY],
        [0.6, AnswerQuality.INCORRECT_BUT_EASY],
        [0.2, AnswerQuality.INCORRECT],
        [0, AnswerQuality.COMPLETE_BLACKOUT],
    ])("%f → %i", (accuracy, quality) => {
        expect(accuracyToQuality(accuracy)).toBe(quality);
    });
});
