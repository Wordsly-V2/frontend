import { parseAsStringLiteral } from "nuqs/server";

export const ADMIN_USER_TABS = ["account", "learning", "path"] as const;
export type AdminUserTab = (typeof ADMIN_USER_TABS)[number];

/** `/admin/users/[id]`: which tab, in the URL so a support link opens on it. */
export const adminUserSearchParams = {
    tab: parseAsStringLiteral(ADMIN_USER_TABS).withDefault("account").withOptions({ clearOnDefault: true }),
};
