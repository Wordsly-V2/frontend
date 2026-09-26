import { describe, expect, it } from "vitest";
import { accountActions, formatRelative, totalPages, userLabel } from "@/lib/admin/users";

const user = {
    userLoginId: "u-1",
    roles: [] as string[],
    status: "active",
    bootstrapAdmin: false,
};

describe("accountActions", () => {
    it("marks your own account so its changes can be hidden", () => {
        expect(accountActions(user, "u-1").isSelf).toBe(true);
        expect(accountActions(user, "u-2").isSelf).toBe(false);
        expect(accountActions(user, undefined).isSelf).toBe(false);
    });

    it("reads admin and suspension from roles and status", () => {
        const actions = accountActions({ ...user, roles: ["admin"], status: "suspended" }, "me");
        expect(actions.isAdmin).toBe(true);
        expect(actions.isSuspended).toBe(true);
    });

    it("warns that a bootstrap admin gets the role back", () => {
        expect(accountActions({ ...user, roles: ["admin"], bootstrapAdmin: true }, "me").adminComesBack).toBe(true);
        expect(accountActions({ ...user, bootstrapAdmin: true }, "me").adminComesBack).toBe(false);
    });
});

describe("userLabel", () => {
    it("falls back from name to email to a short id", () => {
        expect(userLabel({ displayName: "Lan", email: "l@x.io", userLoginId: "abcdef123" })).toBe("Lan");
        expect(userLabel({ displayName: "  ", email: "l@x.io", userLoginId: "abcdef123" })).toBe("l@x.io");
        expect(userLabel({ displayName: null, email: null, userLoginId: "abcdef123" })).toBe("abcdef12");
    });
});

describe("formatRelative", () => {
    const now = new Date("2026-09-26T12:00:00Z");

    it("says Never for no timestamp", () => {
        expect(formatRelative(null, now)).toBe("Never");
    });

    it("picks the largest whole unit", () => {
        expect(formatRelative("2026-09-26T11:59:30Z", now)).toBe("just now");
        expect(formatRelative("2026-09-26T09:00:00Z", now)).toBe("3 hours ago");
        expect(formatRelative("2026-09-25T12:00:00Z", now)).toBe("yesterday");
        expect(formatRelative("2026-09-12T12:00:00Z", now)).toBe("2 weeks ago");
    });
});

describe("totalPages", () => {
    it("never returns less than one page", () => {
        expect(totalPages(0, 20)).toBe(1);
        expect(totalPages(41, 20)).toBe(3);
    });
});
