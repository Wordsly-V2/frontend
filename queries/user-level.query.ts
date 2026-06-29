import { getUserLevel } from "@/apis/user-level.api";
import type { IUserLevel } from "@/types/user-level/user-level.type";
import { useQuery } from "@tanstack/react-query";

export const userLevelQueryKey = () => ["user-level"] as const;

export const useGetUserLevelQuery = (enabled = true) =>
    useQuery<IUserLevel>({
        queryKey: userLevelQueryKey(),
        queryFn: () => getUserLevel(),
        enabled,
        staleTime: 60_000,
    });
