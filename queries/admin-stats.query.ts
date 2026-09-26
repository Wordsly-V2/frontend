import {
    getAdminLearningStats,
    getAdminPathStats,
    getHardestPathItems,
    lookupPathItems,
} from "@/apis/admin-stats.api";
import { queryKeys } from "@/lib/query-keys";
import type { DateRange, HardPathItemView } from "@/types/admin-stats/admin-stats.type";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

// Numbers move all the time; refetch on every visit, keep the last range on
// screen while a new one loads.
const FRESH = { staleTime: 0, placeholderData: keepPreviousData } as const;

export const useAdminLearningStatsQuery = (range: DateRange) =>
    useQuery({
        queryKey: queryKeys.adminStats.learning(range.from, range.to),
        queryFn: () => getAdminLearningStats(range),
        ...FRESH,
    });

export const useAdminPathStatsQuery = (range: DateRange) =>
    useQuery({
        queryKey: queryKeys.adminStats.path(range.from, range.to),
        queryFn: () => getAdminPathStats(range),
        ...FRESH,
    });

/**
 * The Path items learners miss most, with their text. Two services: learning
 * knows the accuracy, curriculum knows what the item says.
 */
export const useHardestPathItemsQuery = ({ limit = 20, minLearners = 3 } = {}) =>
    useQuery({
        queryKey: queryKeys.adminStats.hardestPathItems(limit, minLearners),
        queryFn: async (): Promise<HardPathItemView[]> => {
            const hard = await getHardestPathItems({ limit, minLearners });
            if (hard.length === 0) return [];
            const items = await lookupPathItems(hard.map((h) => h.itemId));
            const byId = new Map(items.map((item) => [item.id, item]));
            return hard.map((h) => ({ ...h, item: byId.get(h.itemId) ?? null }));
        },
        staleTime: 0,
    });
