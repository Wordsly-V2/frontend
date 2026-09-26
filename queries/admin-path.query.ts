import {
    activateAdminRelease,
    archiveAdminRecord,
    createAdminRecord,
    getAdminPathOverview,
    getAdminRecord,
    getAdminReleases,
    getAdminSeedPlan,
    publishAdminRelease,
    restoreAdminRecord,
    updateAdminRecord,
    validateAdminPath,
} from "@/apis/admin-path.api";
import { queryKeys } from "@/lib/query-keys";
import type { AdminKind, AdminRecordBody, AdminWriteResult } from "@/types/admin-path/admin-path.type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Admin data changes under other admins' hands; always refetch on visit.
const FRESH = { staleTime: 0 } as const;

export const useAdminPathOverviewQuery = () =>
    useQuery({ queryKey: queryKeys.adminPath.overview(), queryFn: getAdminPathOverview, ...FRESH });

export const useAdminValidateQuery = () =>
    useQuery({ queryKey: queryKeys.adminPath.validate(), queryFn: validateAdminPath, ...FRESH });

export const useAdminSeedPlanQuery = () =>
    useQuery({ queryKey: queryKeys.adminPath.seedPlan(), queryFn: getAdminSeedPlan, ...FRESH });

export const useAdminReleasesQuery = () =>
    useQuery({ queryKey: queryKeys.adminPath.releases(), queryFn: getAdminReleases, ...FRESH });

export const useAdminRecordQuery = (kind: AdminKind, slug: string | null) =>
    useQuery({
        queryKey: queryKeys.adminPath.record(kind, slug ?? ""),
        queryFn: () => getAdminRecord(kind, slug!),
        enabled: !!slug,
        ...FRESH,
    });

/**
 * Every content write changes the tree, the validation and the seed plan:
 * drop the whole admin cache, then keep the written record as it came back.
 */
function useContentWrite<V>(write: (vars: V) => Promise<AdminWriteResult>) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: write,
        onSuccess: async (result) => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.adminPath.all });
            queryClient.setQueryData(queryKeys.adminPath.record(result.kind, result.slug), result);
        },
    });
}

export const useSaveAdminRecordMutation = () =>
    useContentWrite(
        ({ kind, slug, body }: { kind: AdminKind; slug: string | null; body: AdminRecordBody }) =>
            slug ? updateAdminRecord(kind, slug, body) : createAdminRecord(kind, body),
    );

export const useArchiveAdminRecordMutation = () =>
    useContentWrite(({ kind, slug }: { kind: AdminKind; slug: string }) => archiveAdminRecord(kind, slug));

export const useRestoreAdminRecordMutation = () =>
    useContentWrite(({ kind, slug }: { kind: AdminKind; slug: string }) => restoreAdminRecord(kind, slug));

/** A release changes what learners see: the learner-side `path` cache goes too. */
function useReleaseWrite<V, R>(write: (vars: V) => Promise<R>) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: write,
        onSuccess: () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.adminPath.all }),
                queryClient.invalidateQueries({ queryKey: queryKeys.path.all }),
            ]),
    });
}

export const usePublishAdminReleaseMutation = () => useReleaseWrite((note?: string) => publishAdminRelease(note));

export const useActivateAdminReleaseMutation = () => useReleaseWrite((releaseId: string) => activateAdminRelease(releaseId));
