import {
    cancelSync,
    getSyncItems,
    getSyncJob,
    getSyncJobs,
    previewSync,
    retrySync,
    startSync,
} from "@/apis/admin-dictionary-sync.api";
import { isActiveJob } from "@/lib/admin/dictionary-sync";
import { queryKeys } from "@/lib/query-keys";
import type {
    SyncItemStatus,
    SyncJob,
    SyncJobStatus,
    SyncListQuery,
    SyncScopeInput,
} from "@/types/admin-dictionary-sync/admin-dictionary-sync.type";
import { keepPreviousData, type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

// A run moves on its own, and other admins start runs too.
const FRESH = { staleTime: 0 } as const;
/** How often a running run is polled. */
const LIVE_MS = 2000;

export const useSyncJobsQuery = (query: SyncListQuery<SyncJobStatus>) =>
    useQuery({
        queryKey: queryKeys.adminDictionarySync.jobs(query),
        queryFn: () => getSyncJobs(query),
        placeholderData: keepPreviousData,
        refetchInterval: (q) => (q.state.data?.items.some(isActiveJob) ? LIVE_MS : false),
        ...FRESH,
    });

/**
 * One run, polled while it runs. When it stops, the words it touched are
 * stale everywhere they're shown, so those caches are dropped then.
 */
export const useSyncJobQuery = (jobId: string) => {
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: queryKeys.adminDictionarySync.job(jobId),
        queryFn: () => getSyncJob(jobId),
        refetchInterval: (q) => (isActiveJob(q.state.data) ? LIVE_MS : false),
        ...FRESH,
    });
    const wasActive = useRef(false);
    const active = isActiveJob(query.data);
    useEffect(() => {
        if (wasActive.current && !active) {
            // The word list stopped polling with this run; fetch its final state.
            void queryClient.invalidateQueries({ queryKey: queryKeys.adminDictionarySync.all });
            void invalidateSyncedWords(queryClient);
        }
        wasActive.current = active;
    }, [active, queryClient]);
    return query;
};

export const useSyncItemsQuery = (jobId: string, query: SyncListQuery<SyncItemStatus>, live: boolean) =>
    useQuery({
        queryKey: queryKeys.adminDictionarySync.items(jobId, query),
        queryFn: () => getSyncItems({ jobId, ...query }),
        placeholderData: keepPreviousData,
        refetchInterval: live ? LIVE_MS : false,
        ...FRESH,
    });

/** How many words a scope covers, before the admin starts it. */
export const useSyncPreviewQuery = (input: SyncScopeInput, enabled: boolean) =>
    useQuery({
        queryKey: queryKeys.adminDictionarySync.preview(input),
        queryFn: () => previewSync(input),
        enabled,
        ...FRESH,
    });

/** Everything that shows word fields an admin can see. */
function invalidateSyncedWords(queryClient: QueryClient) {
    return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminVocabulary.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.adminOfficialCourses.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.officialCourses.all }),
    ]);
}

/** A start, cancel or retry stores the returned run and refreshes the lists. */
function useSyncWrite<V>(write: (vars: V) => Promise<SyncJob>) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: write,
        onSuccess: async (job) => {
            queryClient.setQueryData(queryKeys.adminDictionarySync.job(job.id), job);
            await queryClient.invalidateQueries({ queryKey: queryKeys.adminDictionarySync.all });
        },
    });
}

export const useStartSyncMutation = () => useSyncWrite(startSync);
export const useCancelSyncMutation = () => useSyncWrite(cancelSync);
export const useRetrySyncMutation = () => useSyncWrite(retrySync);
