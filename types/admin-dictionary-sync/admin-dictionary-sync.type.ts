import type { IPaginatedResponse } from "@/types/common/pagination.type";

/**
 * Admin Langeek sync runs (vocabulary-service `/admin/vocabulary/sync`).
 * Copied from `src/admin-dictionary-sync/dto`; keep them in step.
 */

/** What a sync can fill, as groups of word fields. */
export const SYNC_FIELDS = ["image", "meaning", "examples", "pronunciation", "level"] as const;
export type SyncField = (typeof SYNC_FIELDS)[number];

/** `fill_missing` writes only blank fields; `overwrite` replaces with what Langeek has. Neither blanks a field. */
export const SYNC_MODES = ["fill_missing", "overwrite"] as const;
export type SyncMode = (typeof SYNC_MODES)[number];

export const SYNC_SCOPES = ["all", "official", "user", "course", "lesson", "words", "health", "retry"] as const;
export type SyncScope = (typeof SYNC_SCOPES)[number];
/** Scopes an admin starts directly (`retry` comes from a finished run). */
export type StartScope = Exclude<SyncScope, "retry">;

export const SYNC_JOB_STATUSES = ["running", "completed", "cancelled", "failed"] as const;
export type SyncJobStatus = (typeof SYNC_JOB_STATUSES)[number];

export const SYNC_ITEM_STATUSES = ["pending", "updated", "skipped", "error"] as const;
export type SyncItemStatus = (typeof SYNC_ITEM_STATUSES)[number];

/**
 * Which words a run covers. `targetId`: a learner's id (user), a course
 * (course; optional for health), a lesson (lesson).
 */
export interface SyncScopeInput {
    scope: StartScope;
    targetId?: string;
    wordIds?: string[];
}

export interface StartSyncInput extends SyncScopeInput {
    fields: SyncField[];
    mode: SyncMode;
}

export interface SyncPreview {
    total: number;
    scopeLabel: string;
}

export interface SyncJob {
    id: string;
    scope: SyncScope;
    targetId: string | null;
    scopeLabel: string;
    fields: SyncField[];
    mode: SyncMode;
    status: SyncJobStatus;
    total: number;
    done: number;
    updated: number;
    skipped: number;
    errored: number;
    /** 0–100. */
    percent: number;
    createdBy: string;
    retryOfId: string | null;
    startedAt: string;
    finishedAt: string | null;
}

export interface SyncItem {
    wordId: string;
    word: string;
    partOfSpeech: string | null;
    status: SyncItemStatus;
    /** Why it was skipped or failed (`no_word_details`, `no_changes`, an error message). */
    reason: string | null;
    changedFields: SyncField[];
    processedAt: string | null;
}

export interface SyncListQuery<S> {
    status?: S;
    page?: number;
    limit?: number;
}

export type SyncJobs = IPaginatedResponse<SyncJob>;
export type SyncItems = IPaginatedResponse<SyncItem>;
