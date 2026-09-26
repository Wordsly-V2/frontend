/**
 * The Wordsly Path admin API (curriculum-service `src/admin-path/`). Copied
 * from the backend; keep them in step.
 */

export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
/** seed: as imported · edited: an admin changed a seeded row · admin: no seed behind it */
export type RowOrigin = "seed" | "edited" | "admin";

export const ADMIN_KINDS = ["unit", "item", "dialogue", "lesson", "checkpoint"] as const;
export type AdminKind = (typeof ADMIN_KINDS)[number];

export interface AdminNode {
    id: string;
    slug: string;
    status: ContentStatus;
    origin: RowOrigin;
    updatedAt: string;
}
export interface AdminLessonNode extends AdminNode {
    order: number;
    title: string;
}
export interface AdminItemNode extends AdminNode {
    type: string;
    text: string;
}
export interface AdminDialogueNode extends AdminNode {
    title: string;
}
export interface AdminUnitNode extends AdminNode {
    order: number;
    title: string;
    lessons: AdminLessonNode[];
    items: { total: number; draft: number; edited: number };
    itemList: AdminItemNode[];
    dialogues: AdminDialogueNode[];
    dialogueCount: number;
    checkpoint: AdminNode | null;
}
export interface AdminStageNode extends AdminNode {
    order: number;
    title: string;
    cefr: string;
    units: AdminUnitNode[];
}
export interface AdminTree {
    stages: AdminStageNode[];
    totals: Record<ContentStatus | RowOrigin, number>;
}

export interface AdminValidation {
    ok: boolean;
    errors: string[];
}

export type SeedPlanAction = "insert" | "update" | "skip" | "conflict";
export interface AdminSeedPlan {
    available: boolean;
    errors: string[];
    summary: Record<SeedPlanAction, number> | null;
    changes: { kind: AdminKind | "stage"; slug: string; action: SeedPlanAction; reason: string }[];
}

export interface AdminRelease {
    id: string;
    version: number;
    note: string | null;
    createdBy: string | null;
    createdAt: string;
    active: boolean;
}

export interface AdminPublishResult {
    id: string;
    version: number;
    retiredItemIds: string[];
}

/** A row in seed shape; the exact fields depend on the kind. */
export type AdminRecordBody = Record<string, unknown>;

export interface AdminRecord {
    kind: AdminKind;
    id: string;
    slug: string;
    status: ContentStatus;
    origin: RowOrigin;
    updatedAt: string;
    updatedBy: string | null;
    record: AdminRecordBody;
}

export interface AdminWriteResult extends AdminRecord {
    validation: AdminValidation;
}
