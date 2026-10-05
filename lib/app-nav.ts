/**
 * The learner app's navigation: which sections exist, which one a path belongs
 * to, and how much app chrome a path gets. Shared by the desktop sidebar, the
 * mobile top bar and the bottom tab bar so the three can never disagree.
 */

export type AppNavKey = "learn" | "path" | "courses" | "progress" | "manage";

export interface AppNavItem {
    key: AppNavKey;
    href: string;
    label: string;
    /** Shown in the mobile bottom tab bar (Manage lives in the user menu there). */
    inTabBar: boolean;
}

export const APP_NAV: readonly AppNavItem[] = [
    { key: "learn", href: "/learn", label: "Learn", inTabBar: true },
    { key: "path", href: "/path", label: "Path", inTabBar: true },
    { key: "courses", href: "/learn/courses", label: "Courses", inTabBar: true },
    { key: "progress", href: "/progress", label: "Progress", inTabBar: true },
    { key: "manage", href: "/manage", label: "Manage", inTabBar: false },
];

/**
 * The section a path belongs to: the longest href that is the path itself or a
 * parent of it, so `/learn/courses/1` lights up Courses rather than Learn.
 * `/learn/difficult` and `/learn/words-details` stay under Learn.
 */
export function activeAppNavKey(
    pathname: string,
    items: readonly AppNavItem[] = APP_NAV,
): AppNavKey | null {
    let best: AppNavItem | null = null;
    for (const item of items) {
        const matches = pathname === item.href || pathname.startsWith(`${item.href}/`);
        if (matches && (!best || item.href.length > best.href.length)) best = item;
    }
    return best?.key ?? null;
}

/**
 * How much chrome a page gets:
 * - `focus`: none at all. A practice session, a lesson, a test or onboarding
 *   owns the whole screen and brings its own exit control.
 * - `bare`: none either, for the sign-in flow.
 * - `app`: sidebar on desktop, top bar and tab bar on mobile.
 * Whether a signed-out visitor sees the public header instead is decided by the
 * shell, not here: it depends on the session, not the path.
 */
export type AppChrome = "focus" | "bare" | "app";

/** Prefixes that run full screen. Every one of them has its own exit control. */
const FOCUS_PREFIXES = [
    "/learn/practice",
    "/learn/onboarding",
    "/path/lesson/",
    "/path/checkpoint/",
    "/path/placement",
    "/path/review",
] as const;

export function appChromeFor(pathname: string): AppChrome {
    if (pathname === "/auth" || pathname.startsWith("/auth/")) return "bare";
    const isFocus = FOCUS_PREFIXES.some((prefix) =>
        prefix.endsWith("/")
            ? pathname.startsWith(prefix)
            : pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    return isFocus ? "focus" : "app";
}

/** The admin area has its own sidebar, so the app's folds down to icons there. */
export function prefersCollapsedSidebar(pathname: string): boolean {
    return pathname === "/admin" || pathname.startsWith("/admin/");
}
