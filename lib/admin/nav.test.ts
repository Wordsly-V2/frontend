import { describe, expect, it } from "vitest";
import { activeAdminHref } from "@/lib/admin/nav";

describe("activeAdminHref", () => {
    it("matches the page itself", () => {
        expect(activeAdminHref("/admin")).toBe("/admin");
        expect(activeAdminHref("/admin/users")).toBe("/admin/users");
    });

    it("prefers the most specific parent", () => {
        expect(activeAdminHref("/admin/users/01a0dc51")).toBe("/admin/users");
        expect(activeAdminHref("/admin/path/item/greetings")).toBe("/admin/path");
    });

    it("does not treat a shared prefix as a parent", () => {
        expect(activeAdminHref("/admin/usersettings")).toBe("/admin");
        expect(activeAdminHref("/learn")).toBeNull();
    });
});
