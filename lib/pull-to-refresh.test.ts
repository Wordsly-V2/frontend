import { describe, expect, it } from "vitest";
import { classifyPull, PULL_MAX, PULL_THRESHOLD, pullDistance, pullProgress } from "./pull-to-refresh";

describe("pullDistance", () => {
    it("is zero for no or upward travel", () => {
        expect(pullDistance(0)).toBe(0);
        expect(pullDistance(-40)).toBe(0);
    });

    it("grows with the finger but never passes the max", () => {
        expect(pullDistance(50)).toBeLessThan(pullDistance(100));
        expect(pullDistance(10_000)).toBeLessThanOrEqual(PULL_MAX);
    });

    it("reaches the threshold within a comfortable thumb pull", () => {
        expect(pullDistance(160)).toBeGreaterThanOrEqual(PULL_THRESHOLD);
    });
});

describe("pullProgress", () => {
    it("clamps to 0..1", () => {
        expect(pullProgress(0)).toBe(0);
        expect(pullProgress(PULL_THRESHOLD / 2)).toBe(0.5);
        expect(pullProgress(PULL_MAX)).toBe(1);
    });
});

describe("classifyPull", () => {
    it("waits until the finger has moved past the slop", () => {
        expect(classifyPull(2, 3)).toBeNull();
    });

    it("accepts a mostly downward move", () => {
        expect(classifyPull(4, 30)).toBe("pull");
    });

    it("rejects upward and sideways moves", () => {
        expect(classifyPull(0, -30)).toBe("other");
        expect(classifyPull(30, 20)).toBe("other");
    });
});
