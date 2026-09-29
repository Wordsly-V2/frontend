import { z } from "zod";
import { emptyStepForm, recordToStepForm, stepFormSchema, stepFormToRecord } from "@/lib/admin-path/step-forms";
import type { AdminRecordBody } from "@/types/admin-path/admin-path.type";

/**
 * The lesson editor's form ⇄ a lesson record in seed shape (curriculum-service
 * `lessonSchema` + `unit` + `order`). Each step is a form of its own
 * (`step-forms.ts`); the server still checks the cross-record rules (steps
 * use only linked items and the unit's dialogues).
 */

export const LESSON_ITEM_ROLES = ["INTRODUCE", "RECYCLE"] as const;

const required = z.string().trim().min(1, "Required");

export const lessonFormSchema = z.object({
    slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase words joined by hyphens"),
    unit: required,
    order: z.string().regex(/^[1-9]\d*$/, "A position from 1"),
    title: required,
    titleVi: required,
    estimatedMinutes: z.string().refine((v) => /^\d+$/.test(v) && +v >= 1 && +v <= 60, "1 to 60 minutes"),
    items: z.array(z.object({ item: required, role: z.enum(LESSON_ITEM_ROLES) })),
    steps: z.array(stepFormSchema).min(1, "A lesson needs at least one step"),
});

export type LessonFormValues = z.infer<typeof lessonFormSchema>;

export function emptyLessonForm(unit = ""): LessonFormValues {
    return {
        slug: "",
        unit,
        order: "1",
        title: "",
        titleVi: "",
        estimatedMinutes: "10",
        items: [],
        steps: [emptyStepForm("INTRO")],
    };
}

/** Form → record. Assumes the form passed `lessonFormSchema`. */
export function lessonFormToRecord(v: LessonFormValues): AdminRecordBody {
    return {
        slug: v.slug.trim(),
        unit: v.unit,
        order: Number(v.order),
        title: v.title.trim(),
        titleVi: v.titleVi.trim(),
        estimatedMinutes: Number(v.estimatedMinutes),
        items: v.items.map((link) => ({ item: link.item.trim(), role: link.role })),
        steps: v.steps.map(stepFormToRecord),
    };
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function recordToLessonForm(r: AdminRecordBody): LessonFormValues {
    return {
        slug: str(r.slug),
        unit: str(r.unit),
        order: String(r.order ?? 1),
        title: str(r.title),
        titleVi: str(r.titleVi),
        estimatedMinutes: String(r.estimatedMinutes ?? 10),
        items: list<Record<string, unknown>>(r.items).map((link) => ({
            item: str(link.item),
            role: link.role === "RECYCLE" ? "RECYCLE" : "INTRODUCE",
        })),
        steps: list<AdminRecordBody>(r.steps).map(recordToStepForm),
    };
}
