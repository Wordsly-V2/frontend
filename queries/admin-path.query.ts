import {
    activateAdminRelease,
    archiveAdminRecord,
    createAdminRecord,
    getAdminPathOverview,
    getAdminRecord,
    getAdminReleases,
    getAdminSeedPlan,
    importAdminUnit,
    publishAdminRelease,
    reorderAdminPath,
    restoreAdminRecord,
    updateAdminRecord,
    validateAdminPath,
} from "@/apis/admin-path.api";
import { queryKeys } from "@/lib/query-keys";
import type { AdminKind, AdminRecordBody, AdminReorderBody, AdminWriteResult } from "@/types/admin-path/admin-path.type";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

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

/** Several records of one kind (a lesson preview's items and dialogues); a missing one errors. */
export const useAdminRecordsQueries = (kind: AdminKind, slugs: string[]) =>
    useQueries({
        queries: slugs.map((slug) => ({
            queryKey: queryKeys.adminPath.record(kind, slug),
            queryFn: () => getAdminRecord(kind, slug),
            retry: false,
            ...FRESH,
        })),
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

/** A unit file import: a dry run writes nothing, an apply changes the whole working copy. */
export const useImportAdminUnitMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ body, apply }: { body: AdminRecordBody; apply: boolean }) => importAdminUnit(body, apply),
        onSuccess: async (result) => {
            if (!result.dryRun) await queryClient.invalidateQueries({ queryKey: queryKeys.adminPath.all });
        },
    });
};

/** Moved rows change the tree, the validation and the seed plan, and each moved record. */
export const useReorderAdminPathMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: AdminReorderBody) => reorderAdminPath(body),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminPath.all }),
    });
};
