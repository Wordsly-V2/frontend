import { getUserLevel } from "@/apis/user-level.api";
import { queryKeys } from "@/lib/query-keys";
import type { IUserLevel } from "@/types/user-level/user-level.type";
import { useQuery } from "@tanstack/react-query";

export const userLevelQueryKey = () => queryKeys.userLevel.all;

export const useGetUserLevelQuery = (enabled = true) =>
    useQuery<IUserLevel>({
        queryKey: userLevelQueryKey(),
        queryFn: () => getUserLevel(),
        enabled,
        staleTime: 60_000,
    });
