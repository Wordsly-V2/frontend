import { ASSIGNABLE_ROLES, USER_STATUSES } from "@/types/admin-users/admin-users.type";
import { parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";

/** `/admin/users` search, filters and page, all in the URL so a view can be shared. */
export const adminUsersSearchParams = {
    q: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    role: parseAsStringLiteral(ASSIGNABLE_ROLES),
    status: parseAsStringLiteral(USER_STATUSES),
    page: parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true }),
};
