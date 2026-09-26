import { apiPaths } from "@/lib/api-paths";
import { request } from "@/lib/axios";
import type {
    DateRange,
    HardPathItem,
    LearningStats,
    PathItemLookup,
    PathStats,
} from "@/types/admin-stats/admin-stats.type";

export const getAdminLearningStats = (range: DateRange): Promise<LearningStats> =>
    request((i) => i.get(apiPaths.adminLearning.stats(), { params: range }));

export const getAdminPathStats = (range: DateRange): Promise<PathStats> =>
    request((i) => i.get(apiPaths.adminPath.stats(), { params: range }));

export const getHardestPathItems = ({
    limit,
    minLearners,
}: {
    limit: number;
    minLearners: number;
}): Promise<HardPathItem[]> =>
    request((i) => i.get(apiPaths.adminLearning.hardestPathItems(), { params: { limit, minLearners } }));

/** Text and unit of Path items by id (curriculum-service; archived items too). */
export const lookupPathItems = (ids: string[]): Promise<PathItemLookup[]> =>
    request((i) => i.post(apiPaths.adminPath.itemsLookup(), { ids }));
