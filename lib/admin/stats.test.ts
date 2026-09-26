import { describe, expect, it } from "vitest";
import { dailyAccuracy, formatPercent, lastDays, ratio, retentionShade, shortDay } from "@/lib/admin/stats";

describe("lastDays", () => {
    it("ends today and counts today as one of the days", () => {
        expect(lastDays(7, new Date(2026, 8, 26, 23, 30))).toEqual({ from: "2026-09-20", to: "2026-09-26" });
        expect(lastDays(1, new Date(2026, 8, 26))).toEqual({ from: "2026-09-26", to: "2026-09-26" });
    });

    it("crosses month and year boundaries", () => {
        expect(lastDays(30, new Date(2026, 0, 5)).from).toBe("2025-12-07");
    });
});

describe("ratio and formatPercent", () => {
    it("has no ratio without a whole", () => {
        expect(ratio(3, 0)).toBeNull();
        expect(formatPercent(null)).toBe("–");
    });

    it("rounds to a whole percent", () => {
        expect(formatPercent(ratio(2, 3))).toBe("67%");
    });
});

describe("dailyAccuracy", () => {
    it("leaves quiet days as gaps", () => {
        expect(
            dailyAccuracy([
                { date: "2026-09-01", reviews: 0, correctReviews: 0 },
                { date: "2026-09-02", reviews: 8, correctReviews: 6 },
            ]),
        ).toEqual([
            { date: "2026-09-01", value: null },
            { date: "2026-09-02", value: 75 },
        ]);
    });
});

describe("shortDay", () => {
    it("formats a calendar day without shifting it", () => {
        expect(shortDay("2026-09-01")).toBe("1 Sept");
    });
});

describe("retentionShade", () => {
    it("stays visible at zero and legible at one", () => {
        expect(retentionShade(0)).toBe(0.06);
        expect(retentionShade(1)).toBe(0.9);
        expect(retentionShade(2)).toBe(0.9);
    });
});
