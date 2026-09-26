/** One link in the admin sidebar. Icons are attached by the component. */
export interface AdminNavLink {
    href: string;
    label: string;
}

export interface AdminNavGroup {
    heading: string;
    links: AdminNavLink[];
}

/** The admin sidebar. Add a link when its page exists, not before. */
export const ADMIN_NAV: AdminNavGroup[] = [
    {
        heading: "Overview",
        links: [
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/users", label: "Users" },
        ],
    },
    {
        heading: "Content",
        links: [{ href: "/admin/path", label: "Wordsly Path" }],
    },
];

/**
 * The sidebar link a path belongs to: the longest href that is the path itself
 * or a parent of it, so `/admin/users/123` lights up Users, not Dashboard.
 */
export function activeAdminHref(pathname: string, groups: AdminNavGroup[] = ADMIN_NAV): string | null {
    let best: string | null = null;
    for (const { href } of groups.flatMap((group) => group.links)) {
        const matches = pathname === href || pathname.startsWith(`${href}/`);
        if (matches && (!best || href.length > best.length)) best = href;
    }
    return best;
}
