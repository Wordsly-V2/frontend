import { parseAsString, parseAsStringLiteral } from "nuqs/server";

export const ADMIN_USER_TABS = ["account", "learning", "path", "vocabulary"] as const;
export type AdminUserTab = (typeof ADMIN_USER_TABS)[number];

/**
 * `/admin/users/[id]`: which tab, and on the Vocabulary tab which course is
 * open, in the URL so a support link (or a content-health row) opens on it.
 */
export const adminUserSearchParams = {
    tab: parseAsStringLiteral(ADMIN_USER_TABS).withDefault("account").withOptions({ clearOnDefault: true }),
    course: parseAsString,
};
