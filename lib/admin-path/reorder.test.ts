import { describe, expect, it } from "vitest";
import { liveSlugs, moveSlug } from "@/lib/admin-path/reorder";

describe("reorder", () => {
    it("lists live rows by order", () => {
        expect(
            liveSlugs([
                { slug: "c", status: "DRAFT", order: 3 },
                { slug: "x", status: "ARCHIVED", order: 2 },
                { slug: "a", status: "PUBLISHED", order: 1 },
            ]),
        ).toEqual(["a", "c"]);
    });

    it("swaps with the neighbour, and refuses to move past either end", () => {
        expect(moveSlug(["a", "b", "c"], "b", -1)).toEqual(["b", "a", "c"]);
        expect(moveSlug(["a", "b", "c"], "b", 1)).toEqual(["a", "c", "b"]);
        expect(moveSlug(["a", "b"], "a", -1)).toBeNull();
        expect(moveSlug(["a", "b"], "b", 1)).toBeNull();
        expect(moveSlug(["a"], "x", 1)).toBeNull();
    });
});
