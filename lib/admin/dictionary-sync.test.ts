import { describe, expect, it } from "vitest";
import {
    fieldList,
    isActiveJob,
    jobSummary,
    reasonLabel,
    retryableCount,
    scopeHref,
    toggleId,
} from "@/lib/admin/dictionary-sync";

const job = { total: 40, done: 12, updated: 8, skipped: 3, errored: 1 };

describe("dictionary sync", () => {
    it("keeps polling only a running run", () => {
        expect(isActiveJob({ status: "running" })).toBe(true);
        expect(isActiveJob({ status: "completed" })).toBe(false);
        expect(isActiveJob({ status: "cancelled" })).toBe(false);
        expect(isActiveJob(undefined)).toBe(false);
    });

    it("sums a run up, leaving out empty counts", () => {
        expect(jobSummary(job)).toBe("12 of 40 words · 8 updated · 3 unchanged · 1 failed");
        expect(jobSummary({ total: 1, done: 0, updated: 0, skipped: 0, errored: 0 })).toBe("0 of 1 word");
    });

    it("lists fields in dialog order, or says all", () => {
        expect(fieldList(["level", "image"])).toBe("Image, Level & word type");
        expect(fieldList(["image", "meaning", "examples", "pronunciation", "level"])).toBe("All fields");
    });

    it("explains known reasons and passes errors through", () => {
        expect(reasonLabel("no_word_details")).toBe("Not found on Langeek");
        expect(reasonLabel("no_changes")).toBe("Nothing new");
        expect(reasonLabel("timeout of 15000ms exceeded")).toBe("timeout of 15000ms exceeded");
        expect(reasonLabel(null)).toBeNull();
    });

    it("retries failed and unfinished words of a finished run only", () => {
        expect(retryableCount({ ...job, status: "cancelled" })).toBe(1 + 28);
        expect(retryableCount({ ...job, done: 40, status: "completed" })).toBe(1);
        expect(retryableCount({ ...job, status: "running" })).toBe(0);
    });

    it("links a learner's run to their vocabulary and a retry to its run", () => {
        expect(scopeHref({ scope: "user", targetId: "u1", retryOfId: null })).toBe("/admin/users/u1?tab=vocabulary");
        expect(scopeHref({ scope: "retry", targetId: "j1", retryOfId: "j1" })).toBe("/admin/vocabulary/sync/j1");
        expect(scopeHref({ scope: "all", targetId: null, retryOfId: null })).toBeNull();
    });

    it("flips one ticked word without touching the set it came from", () => {
        const ids = new Set(["a"]);
        expect([...toggleId(ids, "b")]).toEqual(["a", "b"]);
        expect([...toggleId(ids, "a")]).toEqual([]);
        expect([...ids]).toEqual(["a"]);
    });
});
