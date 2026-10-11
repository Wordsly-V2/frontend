import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/apis/dictionary.api", () => ({
    searchWords: vi.fn(),
    getLangeekWordDetails: vi.fn(),
}));

import { getLangeekWordDetails, searchWords } from "@/apis/dictionary.api";
import { ApiError } from "@/lib/api-error";
import {
    applyLookup,
    enrichWordRow,
    IMPORT_TEMPLATE_CSV,
    mapWithConcurrency,
    mergeExamples,
    parseImportText,
    parseWordsDelimited,
    parseWordsJson,
    rowToCreateMyWord,
    withRateLimitRetry,
} from "@/lib/word-import";

const search = vi.mocked(searchWords);
const details = vi.mocked(getLangeekWordDetails);

describe("parsing", () => {
    it("reads one word per line, then positional columns", () => {
        const rows = parseWordsDelimited("serendipity\nresilient, kiên cường\nanxiety, lo âu, /æŋˈzaɪəti/, noun");
        expect(rows.map((r) => [r.word, r.meaning, r.pronunciation, r.partOfSpeech])).toEqual([
            ["serendipity", "", "", ""],
            ["resilient", "kiên cường", "", ""],
            ["anxiety", "lo âu", "/æŋˈzaɪəti/", "noun"],
        ]);
    });

    it("keeps quoted commas in one cell and reads tabs", () => {
        expect(parseWordsDelimited('run,"chạy, điều hành"')[0].meaning).toBe("chạy, điều hành");
        expect(parseWordsDelimited("cat\tcon mèo")[0].meaning).toBe("con mèo");
    });

    it("maps a header row in any order, with example decorations", () => {
        const [row] = parseWordsDelimited(
            "exampleTranslation,word,example,definition\nTôi chạy.,run,I run.,chạy",
        );
        expect(row.word).toBe("run");
        expect(row.meaning).toBe("chạy");
        expect(row.examples).toMatchObject([{ text: "I run.", translation: "Tôi chạy." }]);
    });

    it("reads the JSON export shape, examples as strings or objects", () => {
        const rows = parseWordsJson(
            JSON.stringify([
                { word: "cat", meaning: "mèo", example: '["A cat."]' },
                { word: "dog", meaning: "chó", examples: [{ text: "A dog.", translation: "Con chó." }] },
                { meaning: "no word" },
            ]),
        );
        expect(rows.map((r) => r.word)).toEqual(["cat", "dog"]);
        expect(rows[0].examples[0].text).toBe("A cat.");
        expect(rows[1].examples[0].translation).toBe("Con chó.");
    });

    it("refuses JSON that isn't a list", () => {
        expect(() => parseWordsJson('{"word":"cat"}')).toThrow(/array/);
    });

    it("tells the format apart", () => {
        expect(parseImportText("[]").format).toBe("json");
        expect(parseImportText("cat, mèo").format).toBe("csv");
        expect(parseImportText("cat\tmèo").format).toBe("tsv");
        expect(parseImportText("cat\ndog").format).toBe("lines");
        expect(parseImportText("   ").rows).toEqual([]);
        expect(parseImportText('[{"word":"cat"}]', "words.json").rows).toHaveLength(1);
    });

    it("parses its own template", () => {
        const { rows, format } = parseImportText(IMPORT_TEMPLATE_CSV);
        expect(format).toBe("csv");
        expect(rows.map((r) => r.word)).toEqual(["resilient", "anxiety"]);
        expect(rows[0].examples[0]).toMatchObject({
            text: "Children are often very resilient.",
            translation: "Trẻ em thường rất kiên cường.",
        });
    });

    it("serializes a row for the API", () => {
        const [row] = parseWordsDelimited("word,meaning,example\n cat , mèo ,A cat.");
        expect(rowToCreateMyWord(row)).toMatchObject({
            word: "cat",
            meaning: "mèo",
            example: JSON.stringify([{ text: "A cat." }]),
        });
    });
});

describe("mergeExamples", () => {
    it("dedupes by text and only backfills what is missing", () => {
        const merged = mergeExamples(
            [{ id: "1", text: "A cat.", translation: "Mine." }],
            [
                { id: "2", text: "a cat.", translation: "Theirs.", audioUrl: "a.mp3" },
                { id: "3", text: "A dog." },
            ],
        );
        expect(merged).toEqual([
            { id: "1", text: "A cat.", translation: "Mine.", audioUrl: "a.mp3" },
            { id: "3", text: "A dog." },
        ]);
    });
});

describe("withRateLimitRetry", () => {
    const limited = () => new ApiError({ message: "Too Many Requests", status: 429, isNetworkError: false });

    it("waits longer each time the server says too fast, then succeeds", async () => {
        const sleep = vi.fn().mockResolvedValue(undefined);
        const call = vi.fn().mockRejectedValueOnce(limited()).mockRejectedValueOnce(limited()).mockResolvedValue("ok");
        await expect(withRateLimitRetry(call, { sleep, baseMs: 100 })).resolves.toBe("ok");
        expect(sleep.mock.calls).toEqual([[100], [200]]);
    });

    it("gives up after the last attempt", async () => {
        const sleep = vi.fn().mockResolvedValue(undefined);
        const call = vi.fn().mockRejectedValue(limited());
        await expect(withRateLimitRetry(call, { sleep, attempts: 3 })).rejects.toThrow("Too Many Requests");
        expect(call).toHaveBeenCalledTimes(3);
    });

    it("does not retry other errors", async () => {
        const call = vi.fn().mockRejectedValue(new ApiError({ message: "nope", status: 500, isNetworkError: false }));
        await expect(withRateLimitRetry(call, { sleep: vi.fn() })).rejects.toThrow("nope");
        expect(call).toHaveBeenCalledTimes(1);
    });
});

describe("enrichWordRow", () => {
    const base = {
        id: "r1",
        word: "cat",
        meaning: "",
        pronunciation: "",
        partOfSpeech: "",
        audioUrl: "",
        imageUrl: "",
        examples: [],
    };

    beforeEach(() => {
        search.mockReset();
        details.mockReset();
    });

    it("fills blanks from the dictionary and records the senses", async () => {
        search.mockResolvedValue([
            { word: "cat", meaning: "mèo", partOfSpeech: "noun", imageUrl: "cat.jpg", langeekWordId: 1 },
            { word: "cat", meaning: "quất", partOfSpeech: "verb", imageUrl: "", langeekWordId: 2 },
        ]);
        details.mockResolvedValue({
            pronunciation: "kæt",
            audioUrl: "cat.mp3",
            examples: [{ text: "A cat.", translation: "Con mèo." }],
        } as never);
        const row = await enrichWordRow({ ...base, meaning: "con mèo" });
        expect(row).toMatchObject({
            lookup: "found",
            meaning: "con mèo",
            partOfSpeech: "noun",
            pronunciation: "kæt",
            imageUrl: "cat.jpg",
        });
        expect(row.senses).toHaveLength(2);
        expect(row.examples[0]).toMatchObject({ text: "A cat.", translation: "Con mèo." });
    });

    it("says not found when the dictionary has nothing", async () => {
        search.mockResolvedValue([]);
        expect((await enrichWordRow(base)).lookup).toBe("not-found");
    });

    it("says failed when the dictionary can't be reached", async () => {
        search.mockRejectedValue(new ApiError({ message: "offline", isNetworkError: true }));
        expect((await enrichWordRow(base)).lookup).toBe("failed");
    });
});

describe("mapWithConcurrency", () => {
    it("keeps order, reports progress and stops when asked", async () => {
        const progress: number[] = [];
        let stop = false;
        const out = await mapWithConcurrency(
            [1, 2, 3, 4],
            1,
            async (n) => {
                if (n === 2) stop = true;
                return n * 10;
            },
            (done) => progress.push(done),
            () => stop,
        );
        expect(out.slice(0, 2)).toEqual([10, 20]);
        expect(out[2]).toBeUndefined();
        expect(progress).toEqual([1, 2]);
    });
});

describe("applyLookup", () => {
    const row = {
        id: "r1",
        word: "cat",
        meaning: "",
        pronunciation: "",
        partOfSpeech: "",
        audioUrl: "",
        imageUrl: "",
        examples: [],
    };
    const looked = {
        ...row,
        meaning: "mèo",
        partOfSpeech: "noun",
        imageUrl: "cat.jpg",
        examples: [{ id: "e1", text: "A cat." }],
        lookup: "found" as const,
    };

    it("fills only what is still blank, keeping what was typed meanwhile", () => {
        const next = applyLookup({ ...row, meaning: "con mèo" }, looked);
        expect(next).toMatchObject({ meaning: "con mèo", partOfSpeech: "noun", imageUrl: "cat.jpg", lookup: "found" });
        expect(next.examples).toHaveLength(1);
    });

    it("drops a lookup for a word that was changed meanwhile", () => {
        const next = applyLookup({ ...row, word: "dog", lookup: "failed" }, looked);
        expect(next.meaning).toBe("");
        expect(next.lookup).toBeUndefined();
    });
});
