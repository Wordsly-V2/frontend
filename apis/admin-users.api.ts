import { apiPaths } from "@/lib/api-paths";
import { request } from "@/lib/axios";
import type {
    AdminUserDeleted,
    AdminUserDetail,
    AdminUserList,
    AdminUsersQuery,
    AdminUserStats,
    AssignableRole,
    UserStatus,
} from "@/types/admin-users/admin-users.type";

export const getAdminUsers = (query: AdminUsersQuery): Promise<AdminUserList> =>
    request((i) => i.get(apiPaths.adminUsers.list(), { params: query }));

export const getAdminUser = (userLoginId: string): Promise<AdminUserDetail> =>
    request((i) => i.get(apiPaths.adminUsers.detail(userLoginId)));

export const getAdminUserStats = ({ from, to }: { from?: string; to?: string } = {}): Promise<AdminUserStats> =>
    request((i) => i.get(apiPaths.adminUsers.stats(), { params: { from, to } }));

/** 409 when it would change your own account or remove the last active admin. */
export const setAdminUserRoles = ({
    userLoginId,
    roles,
}: {
    userLoginId: string;
    roles: AssignableRole[];
}): Promise<AdminUserDetail> => request((i) => i.patch(apiPaths.adminUsers.roles(userLoginId), { roles }));

/** Suspending also signs the account out of every device. */
export const setAdminUserStatus = ({
    userLoginId,
    status,
}: {
    userLoginId: string;
    status: UserStatus;
}): Promise<AdminUserDetail> => request((i) => i.patch(apiPaths.adminUsers.status(userLoginId), { status }));

export const revokeAdminUserSessions = (userLoginId: string): Promise<{ sessionsEnded: number }> =>
    request((i) => i.post(apiPaths.adminUsers.revokeSessions(userLoginId)));

/**
 * Delete the account for good. Their learning data in the other services goes
 * when auth's `user_deleted` event reaches them. 409 for your own account or
 * the last active admin.
 */
export const deleteAdminUser = (userLoginId: string): Promise<AdminUserDeleted> =>
    request((i) => i.delete(apiPaths.adminUsers.detail(userLoginId)));
