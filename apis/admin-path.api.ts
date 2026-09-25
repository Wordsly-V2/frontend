import { apiPaths } from "@/lib/api-paths";
import { request } from "@/lib/axios";
import type {
    AdminKind,
    AdminPublishResult,
    AdminRecord,
    AdminRecordBody,
    AdminRelease,
    AdminSeedPlan,
    AdminTree,
    AdminValidation,
    AdminWriteResult,
} from "@/types/admin-path/admin-path.type";

export const getAdminPathOverview = (): Promise<AdminTree> =>
    request((i) => i.get(apiPaths.adminPath.overview()));

export const validateAdminPath = (): Promise<AdminValidation> =>
    request((i) => i.get(apiPaths.adminPath.validate()));

export const getAdminSeedPlan = (): Promise<AdminSeedPlan> =>
    request((i) => i.get(apiPaths.adminPath.seedPlan()));

export const getAdminReleases = (): Promise<AdminRelease[]> =>
    request((i) => i.get(apiPaths.adminPath.releases()));

/** 400 with `errors` when the working copy is invalid; nothing is published then. */
export const publishAdminRelease = (note?: string): Promise<AdminPublishResult> =>
    request((i) => i.post(apiPaths.adminPath.releases(), { note }));

export const activateAdminRelease = (releaseId: string): Promise<{ id: string; version: number }> =>
    request((i) => i.post(apiPaths.adminPath.activate(releaseId)));

export const getAdminRecord = (kind: AdminKind, slug: string): Promise<AdminRecord> =>
    request((i) => i.get(apiPaths.adminPath.record(kind, slug)));

export const createAdminRecord = (kind: AdminKind, body: AdminRecordBody): Promise<AdminWriteResult> =>
    request((i) => i.post(apiPaths.adminPath.content(kind), body));

export const updateAdminRecord = (kind: AdminKind, slug: string, body: AdminRecordBody): Promise<AdminWriteResult> =>
    request((i) => i.put(apiPaths.adminPath.record(kind, slug), body));

export const archiveAdminRecord = (kind: AdminKind, slug: string): Promise<AdminWriteResult> =>
    request((i) => i.delete(apiPaths.adminPath.record(kind, slug)));

export const restoreAdminRecord = (kind: AdminKind, slug: string): Promise<AdminWriteResult> =>
    request((i) => i.post(apiPaths.adminPath.restore(kind, slug)));
