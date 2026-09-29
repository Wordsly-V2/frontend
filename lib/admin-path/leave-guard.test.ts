import { describe, expect, it } from "vitest";
import { leavesPageInApp } from "@/lib/admin-path/leave-guard";

const here = "http://localhost:4000/admin/path/item/mother?x=1";

describe("leavesPageInApp", () => {
    it("is true for another page or query in the app", () => {
        expect(leavesPageInApp("/admin/path", here)).toBe(true);
        expect(leavesPageInApp("/admin/path/item/mother?x=2", here)).toBe(true);
        expect(leavesPageInApp("../unit/a1-01", here)).toBe(true);
    });

    it("is false for the same page, a hash, or another site", () => {
        expect(leavesPageInApp("/admin/path/item/mother?x=1", here)).toBe(false);
        expect(leavesPageInApp("#notes", here)).toBe(false);
        expect(leavesPageInApp("https://example.com/", here)).toBe(false);
    });
});
