/**
 * Whether following `href` from `current` leaves the page inside the app, so
 * an editor with unsaved edits should ask first. Another origin is a full page
 * load, which `beforeunload` already asks about; a hash on the same page stays.
 */
export function leavesPageInApp(href: string, current: string): boolean {
    let to: URL;
    let from: URL;
    try {
        from = new URL(current);
        to = new URL(href, from);
    } catch {
        return false;
    }
    if (to.origin !== from.origin) return false;
    return to.pathname !== from.pathname || to.search !== from.search;
}
