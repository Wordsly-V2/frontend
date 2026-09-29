import { z } from "zod";
import { CEFR_LEVELS, type AdminRecordBody, type CefrLevel } from "@/types/admin-path/admin-path.type";

/**
 * The stage and unit editors' forms ⇄ records in seed shape (curriculum-service
 * `stageSchema`, and `unitFileSchema` without its children). Everything is a
 * string in the form; the record drops an empty `descriptionVi` (the seed has
 * no nulls), so saving an unchanged stage or unit hashes the same.
 */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const required = z.string().trim().min(1, "Required");
const slug = z.string().trim().regex(SLUG, "Lowercase words joined by hyphens, like b2-plus");
const position = z.string().regex(/^[1-9]\d*$/, "A position from 1");

const str = (v: unknown) => (typeof v === "string" ? v : "");
const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

// ─── Stage ──────────────────────────────────────────────────────────────────

export const stageFormSchema = z.object({
    slug,
    cefr: z.enum(CEFR_LEVELS),
    order: position,
    title: required,
    titleVi: required,
    descriptionVi: z.string(),
});

export type StageFormValues = z.infer<typeof stageFormSchema>;

export function emptyStageForm(order = 1): StageFormValues {
    return { slug: "", cefr: "A1", order: String(order), title: "", titleVi: "", descriptionVi: "" };
}

/** Form → record. Assumes the form passed `stageFormSchema`. */
export function stageFormToRecord(v: StageFormValues): AdminRecordBody {
    return {
        slug: v.slug.trim(),
        cefr: v.cefr,
        order: Number(v.order),
        title: v.title.trim(),
        titleVi: v.titleVi.trim(),
        ...(v.descriptionVi.trim() && { descriptionVi: v.descriptionVi.trim() }),
    };
}

export function recordToStageForm(r: AdminRecordBody): StageFormValues {
    return {
        slug: str(r.slug),
        cefr: CEFR_LEVELS.includes(r.cefr as CefrLevel) ? (r.cefr as CefrLevel) : "A1",
        order: String(r.order ?? 1),
        title: str(r.title),
        titleVi: str(r.titleVi),
        descriptionVi: str(r.descriptionVi),
    };
}

// ─── Unit ───────────────────────────────────────────────────────────────────

export const unitFormSchema = z.object({
    slug,
    stage: required,
    order: position,
    title: required,
    titleVi: required,
    descriptionVi: z.string(),
    /** Objects, because react-hook-form's field arrays need them. */
    canDo: z.array(z.object({ text: required })).min(1, "Add at least one can-do statement"),
});

export type UnitFormValues = z.infer<typeof unitFormSchema>;

export function emptyUnitForm(stage = "", order = 1): UnitFormValues {
    return { slug: "", stage, order: String(order), title: "", titleVi: "", descriptionVi: "", canDo: [{ text: "" }] };
}

/** Form → record. Assumes the form passed `unitFormSchema`. */
export function unitFormToRecord(v: UnitFormValues): AdminRecordBody {
    return {
        slug: v.slug.trim(),
        stage: v.stage,
        order: Number(v.order),
        title: v.title.trim(),
        titleVi: v.titleVi.trim(),
        ...(v.descriptionVi.trim() && { descriptionVi: v.descriptionVi.trim() }),
        canDo: v.canDo.map((c) => c.text.trim()),
    };
}

export function recordToUnitForm(r: AdminRecordBody): UnitFormValues {
    return {
        slug: str(r.slug),
        stage: str(r.stage),
        order: String(r.order ?? 1),
        title: str(r.title),
        titleVi: str(r.titleVi),
        descriptionVi: str(r.descriptionVi),
        canDo: list<unknown>(r.canDo).map((text) => ({ text: str(text) })),
    };
}
