import { apiPaths } from "@/lib/api-paths";
import { request } from "@/lib/axios";
import type {
    StartSyncInput,
    SyncItems,
    SyncItemStatus,
    SyncJob,
    SyncJobs,
    SyncJobStatus,
    SyncListQuery,
    SyncPreview,
    SyncScopeInput,
} from "@/types/admin-dictionary-sync/admin-dictionary-sync.type";

/**
 * Langeek sync runs. A run fills or refreshes word fields from Langeek (and
 * Cambridge for UK/US pronunciation) in the background, one word at a time;
 * only one runs at once (409 otherwise), and without Kafka none can (503).
 */

export const previewSync = (input: SyncScopeInput): Promise<SyncPreview> =>
    request((i) => i.post(apiPaths.adminDictionarySync.preview(), input));

export const startSync = (input: StartSyncInput): Promise<SyncJob> =>
    request((i) => i.post(apiPaths.adminDictionarySync.jobs(), input));

export const getSyncJobs = (query: SyncListQuery<SyncJobStatus>): Promise<SyncJobs> =>
    request((i) => i.get(apiPaths.adminDictionarySync.jobs(), { params: query }));

export const getSyncJob = (jobId: string): Promise<SyncJob> =>
    request((i) => i.get(apiPaths.adminDictionarySync.job(jobId)));

export const getSyncItems = ({
    jobId,
    ...query
}: SyncListQuery<SyncItemStatus> & { jobId: string }): Promise<SyncItems> =>
    request((i) => i.get(apiPaths.adminDictionarySync.items(jobId), { params: query }));

export const cancelSync = ({ jobId }: { jobId: string }): Promise<SyncJob> =>
    request((i) => i.post(apiPaths.adminDictionarySync.cancel(jobId)));

/** A new run over a finished run's failed and unfinished words. */
export const retrySync = ({ jobId }: { jobId: string }): Promise<SyncJob> =>
    request((i) => i.post(apiPaths.adminDictionarySync.retry(jobId)));
