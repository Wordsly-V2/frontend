import { describe, expect, it } from "vitest";
import {
    affectedTotal,
    cardRows,
    daysAgo,
    describeLearningReset,
    describePathReset,
    formatDay,
    LEARNING_RESET_CHOICES,
    summariesById,
} from "./learners";

describe("describeLearningReset", () => {
    it("names every choice and never lists settings as removed", () => {
        for (const { choice } of LEARNING_RESET_CHOICES) {
            const d = describeLearningReset(choice);
            expect(d.name).not.toBe("");
            expect(d.removes.length).toBeGreaterThan(0);
            expect(d.removes.join(" ")).not.toMatch(/settings/);
            expect(d.keeps.join(" ")).toMatch(/settings, saved words and notifications/);
        }
    });

    it("keeps the other source's cards when one source is cleared", () => {
        const path = describeLearningReset({ scope: "cards", source: "path" });
        expect(path.removes[0]).toMatch(/Wordsly Path/);
        expect(path.keeps[0]).toMatch(/own courses/);
        const vocab = describeLearningReset({ scope: "cards", source: "vocab" });
        expect(vocab.keeps[0]).toMatch(/Wordsly Path/);
    });

    it("keeps the daily goal on a streak reset, and history only goes with everything", () => {
        expect(describeLearningReset({ scope: "streak" }).keeps).toContain("Their daily goal");
        expect(describeLearningReset({ scope: "xp" }).removes.join(" ")).not.toMatch(/report history/);
        expect(describeLearningReset({ scope: "all" }).removes.join(" ")).toMatch(/report history/);
    });
});

describe("describePathReset", () => {
    it("moves the Path cards from kept to removed with the option", () => {
        expect(describePathReset(false).keeps.join(" ")).toMatch(/Wordsly Path items/);
        expect(describePathReset(false).removes.join(" ")).not.toMatch(/Wordsly Path items/);
        expect(describePathReset(true).removes.join(" ")).toMatch(/Wordsly Path items/);
        expect(describePathReset(true).keeps.join(" ")).not.toMatch(/Wordsly Path items/);
    });
});

describe("cardRows", () => {
    const counts = { cards: 2, due: 1, leeches: 0, suspended: 1 };

    it("puts own courses first and adds a total", () => {
        const rows = cardRows([
            { source: "PATH", ...counts },
            { source: "VOCAB", cards: 5, due: 3, leeches: 1, suspended: 0 },
        ]);
        expect(rows.map((r) => r.label)).toEqual(["Own courses", "Wordsly Path", "Total"]);
        expect(rows[2].counts).toEqual({ cards: 7, due: 4, leeches: 1, suspended: 1 });
    });

    it("has no total for a single source, and nothing for none", () => {
        expect(cardRows([{ source: "VOCAB", ...counts }])).toHaveLength(1);
        expect(cardRows([])).toEqual([]);
    });
});

describe("days", () => {
    it("formats a calendar day without shifting it", () => {
        // Never the 31st of August, whatever the test machine's zone.
        expect(formatDay("2026-09-01")).toMatch(/^1 Sep\w* 2026$/);
    });

    it("counts days back from today", () => {
        expect(daysAgo(null, "2026-09-29")).toBe("Never");
        expect(daysAgo("2026-09-29", "2026-09-29")).toBe("Today");
        expect(daysAgo("2026-09-28", "2026-09-29")).toBe("Yesterday");
        expect(daysAgo("2026-09-24", "2026-09-29")).toBe("5 days ago");
        expect(daysAgo("2026-01-02", "2026-09-29")).toBe(formatDay("2026-01-02"));
    });
});

it("sums affected rows and maps summaries by id", () => {
    expect(affectedTotal({ a: 2, b: 3 })).toBe(5);
    const s = { userLoginId: "u1", lastActiveDate: null, streak: 0, level: 1, totalXp: 0, cards: 0, dueNow: 0 };
    expect(summariesById([s]).get("u1")).toBe(s);
    expect(summariesById(undefined).size).toBe(0);
});
