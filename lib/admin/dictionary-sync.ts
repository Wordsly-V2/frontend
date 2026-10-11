import { countOf } from "@/lib/admin/vocabulary";
import {
    SYNC_FIELDS,
    type SyncField,
    type SyncItemStatus,
    type SyncJob,
    type SyncJobStatus,
    type SyncMode,
} from "@/types/admin-dictionary-sync/admin-dictionary-sync.type";

/** The word fields a Langeek sync can fill, and what each one writes. */
export const FIELD_OPTIONS: readonly { value: SyncField; label: string; hint: string }[] = [
    { value: "image", label: "Image", hint: "Picture and thumbnail" },
    { value: "meaning", label: "Meaning", hint: "Vietnamese meaning" },
    { value: "examples", label: "Examples", hint: "Example sentences with audio and translation" },
    { value: "pronunciation", label: "Pronunciation", hint: "IPA and audio, UK and US" },
    { value: "level", label: "Level & word type", hint: "CEFR level and part of speech" },
];

export const FIELD_LABELS = Object.fromEntries(FIELD_OPTIONS.map((field) => [field.value, field.label])) as Record<
    SyncField,
    string
>;

export const MODE_OPTIONS: readonly { value: SyncMode; label: string; hint: string }[] = [
    {
        value: "fill_missing",
        label: "Fill missing only",
        hint: "Only empty fields are written. Nothing you set is changed.",
    },
    {
        value: "overwrite",
        label: "Replace with Langeek",
        hint: "Fields Langeek has are replaced, examples included. Empty answers never clear a field.",
    },
];

export const MODE_LABELS: Record<SyncMode, string> = { fill_missing: "Fill missing", overwrite: "Replace" };

export const JOB_STATUS_LABELS: Record<SyncJobStatus, string> = {
    running: "Running",
    completed: "Done",
    cancelled: "Cancelled",
    failed: "Failed",
};

export const JOB_STATUS_BADGES: Record<SyncJobStatus, "default" | "success" | "muted" | "destructive"> = {
    running: "default",
    completed: "success",
    cancelled: "muted",
    failed: "destructive",
};

export const JOB_STATUS_FILTERS: readonly { value: SyncJobStatus | null; label: string }[] = [
    { value: null, label: "All" },
    { value: "running", label: "Running" },
    { value: "completed", label: "Done" },
    { value: "cancelled", label: "Cancelled" },
];

export const ITEM_STATUS_LABELS: Record<SyncItemStatus, string> = {
    pending: "Waiting",
    updated: "Updated",
    skipped: "Unchanged",
    error: "Failed",
};

export const ITEM_STATUS_BADGES: Record<SyncItemStatus, "muted" | "success" | "secondary" | "destructive"> = {
    pending: "muted",
    updated: "success",
    skipped: "secondary",
    error: "destructive",
};

export const ITEM_STATUS_FILTERS: readonly { value: SyncItemStatus | null; label: string }[] = [
    { value: null, label: "All" },
    { value: "updated", label: "Updated" },
    { value: "skipped", label: "Unchanged" },
    { value: "error", label: "Failed" },
    { value: "pending", label: "Waiting" },
];

const REASONS: Record<string, string> = {
    no_word_details: "Not found on Langeek",
    no_changes: "Nothing new",
    word_deleted: "Word was deleted",
};

/** A skip or failure reason in words; error messages pass through as they are. */
export function reasonLabel(reason: string | null): string | null {
    if (!reason) return null;
    return REASONS[reason] ?? reason;
}

/** A run still moving, so its page keeps polling. */
export function isActiveJob(job: Pick<SyncJob, "status"> | undefined | null): boolean {
    return job?.status === "running";
}

/** "Image, Meaning" in the order the dialog lists them. */
export function fieldList(fields: readonly SyncField[]): string {
    if (fields.length === SYNC_FIELDS.length) return "All fields";
    return SYNC_FIELDS.filter((field) => fields.includes(field))
        .map((field) => FIELD_LABELS[field])
        .join(", ");
}

/** "12 of 40 words · 8 updated · 3 unchanged · 1 failed". */
export function jobSummary(job: Pick<SyncJob, "done" | "total" | "updated" | "skipped" | "errored">): string {
    const parts = [`${job.done.toLocaleString()} of ${countOf(job.total, "word")}`];
    if (job.updated) parts.push(`${job.updated.toLocaleString()} updated`);
    if (job.skipped) parts.push(`${job.skipped.toLocaleString()} unchanged`);
    if (job.errored) parts.push(`${job.errored.toLocaleString()} failed`);
    return parts.join(" · ");
}

/** Words a retry would pick up: the failed ones, and those a cancel left waiting. */
export function retryableCount(job: Pick<SyncJob, "status" | "total" | "done" | "errored">): number {
    if (isActiveJob(job)) return 0;
    return job.errored + Math.max(0, job.total - job.done);
}

/** Where the run's target lives in the admin panel, when it has a page. */
export function scopeHref(job: Pick<SyncJob, "scope" | "targetId" | "retryOfId">): string | null {
    if (job.scope === "user" && job.targetId) return `/admin/users/${job.targetId}?tab=vocabulary`;
    if (job.scope === "retry" && job.retryOfId) return `/admin/vocabulary/sync/${job.retryOfId}`;
    return null;
}

/** The ticked word ids with one row flipped. */
export function toggleId(ids: ReadonlySet<string>, id: string): Set<string> {
    const next = new Set(ids);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
}
