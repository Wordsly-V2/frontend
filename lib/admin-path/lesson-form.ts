import { z } from "zod";
import type { AdminRecordBody } from "@/types/admin-path/admin-path.type";

/**
 * The lesson editor's form ⇄ a lesson record in seed shape (curriculum-service
 * `lessonSchema` + `unit` + `order`). Steps keep their payload as JSON text:
 * eight step types with their own shapes, checked in full by the server
 * (`stepPayloadSchemas`); the form only makes sure it is a JSON object.
 */

export const STEP_TYPES = ["WARMUP", "INTRO", "EXPLAIN", "PRACTICE", "PATTERN_DRILL", "SPEAK", "DIALOGUE", "QUIZ"] as const;
export const LESSON_ITEM_ROLES = ["INTRODUCE", "RECYCLE"] as const;

/** A minimal valid-looking payload per step type, to start from. */
export const STEP_TEMPLATES: Record<(typeof STEP_TYPES)[number], object> = {
    WARMUP: { schemaVersion: 1, maxItems: 8 },
    INTRO: { schemaVersion: 1, items: [] },
    EXPLAIN: { schemaVersion: 1, titleVi: "", bodyVi: "" },
    PRACTICE: { schemaVersion: 1, modes: ["flashcard", "listening"], items: [] },
    PATTERN_DRILL: { schemaVersion: 1, pattern: "", prompts: [{ cueVi: "", slots: {}, answer: "" }] },
    SPEAK: { schemaVersion: 1, lines: [{ en: "", vi: "" }] },
    DIALOGUE: { schemaVersion: 1, dialogue: "", mode: "roleplay" },
    QUIZ: { schemaVersion: 1, questions: [] },
};

function jsonObject(text: string): boolean {
    try {
        const value: unknown = JSON.parse(text);
        return typeof value === "object" && value !== null && !Array.isArray(value);
    } catch {
        return false;
    }
}

const required = z.string().trim().min(1, "Required");

export const lessonFormSchema = z.object({
    slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase words joined by hyphens"),
    unit: required,
    order: z.string().regex(/^[1-9]\d*$/, "A position from 1"),
    title: required,
    titleVi: required,
    estimatedMinutes: z.string().refine((v) => /^\d+$/.test(v) && +v >= 1 && +v <= 60, "1 to 60 minutes"),
    items: z.array(z.object({ item: required, role: z.enum(LESSON_ITEM_ROLES) })),
    steps: z
        .array(
            z.object({
                type: z.enum(STEP_TYPES),
                payload: z.string().refine(jsonObject, "Must be a JSON object, like {\"schemaVersion\": 1}"),
            }),
        )
        .min(1, "A lesson needs at least one step"),
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
        steps: [{ type: "INTRO", payload: JSON.stringify(STEP_TEMPLATES.INTRO, null, 2) }],
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
        steps: v.steps.map((step) => ({ type: step.type, payload: JSON.parse(step.payload) as unknown })),
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
        steps: list<Record<string, unknown>>(r.steps).map((step) => ({
            type: STEP_TYPES.includes(step.type as never) ? (step.type as LessonFormValues["steps"][number]["type"]) : "INTRO",
            payload: JSON.stringify(step.payload ?? {}, null, 2),
        })),
    };
}
