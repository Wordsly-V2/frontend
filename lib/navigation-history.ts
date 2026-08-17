/**
 * A trail of the routes visited in this app session.
 *
 * The History API can tell you how many entries exist but never *what* is in
 * them, so a "back" affordance has no way to know whether `history.back()` will
 * land on the page it names — or on an unrelated one, or outside the app
 * entirely. This trail answers that, so back buttons can go back when back is
 * right and navigate when it isn't.
 *
 * Pathnames only, deliberately: the search string comes back for free when the
 * browser restores the entry, and tracking it would mean `useSearchParams()` in
 * the root layout, which opts the whole app out of static rendering.
 */

const MAX_TRAIL_LENGTH = 20;

const trail: string[] = [];

export function recordVisit(pathname: string): void {
    if (trail[trail.length - 1] === pathname) return;
    trail.push(pathname);
    if (trail.length > MAX_TRAIL_LENGTH) trail.shift();
}

/** Where `history.back()` would land, or `null` on a cold entry into the app. */
export function getPreviousPathname(): string | null {
    return trail.length >= 2 ? trail[trail.length - 2] : null;
}

/** Strip search and hash — `/learn/courses?page=2` → `/learn/courses`. */
export function toPathname(href: string): string {
    return href.split("?")[0].split("#")[0];
}
