import { describe, expect, it } from "vitest";
import { activeAppNavKey, APP_NAV, appChromeFor, prefersCollapsedSidebar, visibleAppNav } from "./app-nav";

describe("activeAppNavKey", () => {
    it("picks the most specific section", () => {
        expect(activeAppNavKey("/learn")).toBe("learn");
        expect(activeAppNavKey("/learn/courses")).toBe("courses");
        expect(activeAppNavKey("/learn/courses/abc")).toBe("courses");
        expect(activeAppNavKey("/learn/difficult")).toBe("difficult");
        expect(activeAppNavKey("/learn/words-details")).toBe("learn");
        expect(activeAppNavKey("/path/unit/1")).toBe("path");
        expect(activeAppNavKey("/manage/courses/1")).toBe("manage");
        expect(activeAppNavKey("/profile")).toBe("profile");
        expect(activeAppNavKey("/admin/users/1")).toBe("admin");
    });

    it("falls back to the parent among a subset of sections", () => {
        const tabs = APP_NAV.filter((item) => item.inTabBar);
        expect(activeAppNavKey("/learn/difficult", tabs)).toBe("learn");
        expect(activeAppNavKey("/profile", tabs)).toBeNull();
    });

    it("does not match a prefix that is not a parent segment", () => {
        expect(activeAppNavKey("/pathway")).toBeNull();
        expect(activeAppNavKey("/progressive")).toBeNull();
    });

    it("returns null outside the sections", () => {
        expect(activeAppNavKey("/")).toBeNull();
        expect(activeAppNavKey("/profiles")).toBeNull();
    });
});

describe("visibleAppNav", () => {
    it("lists Admin for admins only", () => {
        expect(visibleAppNav(false).map((item) => item.key)).not.toContain("admin");
        expect(visibleAppNav(true).map((item) => item.key)).toContain("admin");
        expect(visibleAppNav(false).map((item) => item.key)).toContain("profile");
    });
});

describe("appChromeFor", () => {
    it("runs sessions, lessons, tests and onboarding full screen", () => {
        expect(appChromeFor("/learn/practice")).toBe("focus");
        expect(appChromeFor("/learn/onboarding")).toBe("focus");
        expect(appChromeFor("/path/lesson/1")).toBe("focus");
        expect(appChromeFor("/path/checkpoint/1")).toBe("focus");
        expect(appChromeFor("/path/placement")).toBe("focus");
        expect(appChromeFor("/path/review")).toBe("focus");
        expect(appChromeFor("/path/review/saved")).toBe("focus");
    });

    it("keeps the map, units and hubs inside the app frame", () => {
        expect(appChromeFor("/path")).toBe("app");
        expect(appChromeFor("/path/unit/1")).toBe("app");
        expect(appChromeFor("/learn")).toBe("app");
        expect(appChromeFor("/learn/courses/1")).toBe("app");
        expect(appChromeFor("/admin/users")).toBe("app");
        expect(appChromeFor("/")).toBe("app");
    });

    it("leaves the sign-in flow bare", () => {
        expect(appChromeFor("/auth/login")).toBe("bare");
        expect(appChromeFor("/auth/redirect")).toBe("bare");
        expect(appChromeFor("/authors")).toBe("app");
    });

    it("does not treat look-alike paths as focus routes", () => {
        expect(appChromeFor("/learn/practiced")).toBe("app");
        expect(appChromeFor("/path/reviews")).toBe("app");
    });
});

describe("prefersCollapsedSidebar", () => {
    it("folds the app sidebar inside the admin area only", () => {
        expect(prefersCollapsedSidebar("/admin")).toBe(true);
        expect(prefersCollapsedSidebar("/admin/path/item/x")).toBe(true);
        expect(prefersCollapsedSidebar("/administer")).toBe(false);
        expect(prefersCollapsedSidebar("/learn")).toBe(false);
    });
});
