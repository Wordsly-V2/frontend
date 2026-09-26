import {
    getAdminUser,
    getAdminUsers,
    getAdminUserStats,
    revokeAdminUserSessions,
    setAdminUserRoles,
    setAdminUserStatus,
} from "@/apis/admin-users.api";
import { queryKeys } from "@/lib/query-keys";
import type { AdminUserDetail, AdminUsersQuery } from "@/types/admin-users/admin-users.type";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Accounts change under other admins' hands; always refetch on visit.
const FRESH = { staleTime: 0 } as const;

export const useAdminUsersQuery = (query: AdminUsersQuery) =>
    useQuery({
        queryKey: queryKeys.adminUsers.list(query),
        queryFn: () => getAdminUsers(query),
        // Keep the current page on screen while the next one loads.
        placeholderData: keepPreviousData,
        ...FRESH,
    });

export const useAdminUserQuery = (userLoginId: string) =>
    useQuery({
        queryKey: queryKeys.adminUsers.detail(userLoginId),
        queryFn: () => getAdminUser(userLoginId),
        ...FRESH,
    });

export const useAdminUserStatsQuery = (range: { from?: string; to?: string } = {}) =>
    useQuery({
        queryKey: queryKeys.adminUsers.stats(range.from, range.to),
        queryFn: () => getAdminUserStats(range),
        ...FRESH,
    });

/** Keep the returned account as the detail, and refresh every list and count. */
function useAccountWrite<V>(write: (vars: V) => Promise<AdminUserDetail>) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: write,
        onSuccess: async (detail) => {
            queryClient.setQueryData(queryKeys.adminUsers.detail(detail.userLoginId), detail);
            await queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all });
        },
    });
}

export const useSetAdminUserRolesMutation = () => useAccountWrite(setAdminUserRoles);

export const useSetAdminUserStatusMutation = () => useAccountWrite(setAdminUserStatus);

export const useRevokeAdminUserSessionsMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: revokeAdminUserSessions,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all }),
    });
};
