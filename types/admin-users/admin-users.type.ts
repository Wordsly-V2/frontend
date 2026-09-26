/** Shapes of auth-service's `/admin/users` API (`src/admin-users/dto/admin-users.dto.ts`). */

/** Values `UserLogin.status` may hold; anything but `active` cannot sign in. */
export const USER_STATUSES = ["active", "suspended"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** Roles the admin API hands out. */
export const ASSIGNABLE_ROLES = ["admin"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export interface AdminUserSummary {
    /** The `UserLogin` id: what every service scopes rows by. */
    userLoginId: string;
    email: string | null;
    displayName: string | null;
    pictureUrl: string | null;
    provider: string;
    status: string;
    roles: string[];
    /** Listed in ADMIN_EMAILS: removing admin is undone at their next sign-in. */
    bootstrapAdmin: boolean;
    /** Signed-in devices (live refresh tokens). */
    activeSessions: number;
    createdAt: string;
}

export interface AdminUserDetail extends AdminUserSummary {
    updatedAt: string;
    /** Last sign-in or token refresh, if ever. */
    lastSeenAt: string | null;
}

export interface AdminUserList {
    items: AdminUserSummary[];
    total: number;
    page: number;
    pageSize: number;
}

export interface AdminUsersQuery {
    q?: string;
    role?: AssignableRole;
    status?: UserStatus;
    page?: number;
    pageSize?: number;
}

export interface AdminUserStats {
    from: string;
    to: string;
    totals: { users: number; admins: number; suspended: number };
    newUsers: number;
    signups: { date: string; count: number }[];
}
