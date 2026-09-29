import { z } from "zod";
import type { AdminRecordBody } from "@/types/admin-path/admin-path.type";

/**
 * Questions (curriculum-service `questionSchema`, and `placementQuestionSchema`
 * which adds the `unit` it probes) ⇄ one flat form per question: every kind's
 * fields are always there, and the record keeps only the chosen kind's, minus
 * empty optional ones, so an unchanged question round-trips to the same
 * record. Used by the unit test and placement forms (and QUIZ steps later).
 */

export const QUESTION_KINDS = ["choice", "gap", "order"] as const;
export type QuestionKind = (typeof QUESTION_KINDS)[number];

export const QUESTION_KIND_LABEL: Record<QuestionKind, string> = {
    choice: "Multiple choice",
    gap: "Fill the gap",
    order: "Put the words in order",
};

/** The seed's slug rule; items and units are named by slug. */
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const required = z.string().trim().min(1, "Required");
const text = z.object({ text: z.string() });

export const questionFormSchema = z
    .object({
        kind: z.enum(QUESTION_KINDS),
        /** Only placement questions have one; empty otherwise. */
        unit: z.string(),
        item: z.string().trim().refine((v) => v === "" || SLUG.test(v), "An item slug, like good-morning"),
        explanationVi: z.string(),
        // choice
        prompt: z.string(),
        audioText: z.string(),
        options: z.array(text),
        /** Index of the right option, as a string ("" = none picked). */
        answer: z.string(),
        // gap
        sentence: z.string(),
        hintVi: z.string(),
        answers: z.array(text),
        // order
        vi: z.string(),
        orderAnswer: z.string(),
    })
    .superRefine((q, ctx) => {
        const need = (path: (string | number)[], value: string, message = "Required") => {
            if (!value.trim()) ctx.addIssue({ code: "custom", path, message });
        };
        if (q.kind === "choice") {
            need(["prompt"], q.prompt);
            if (q.options.length < 2 || q.options.length > 6) {
                ctx.addIssue({ code: "custom", path: ["options"], message: "2 to 6 options" });
            }
            q.options.forEach((o, i) => need(["options", i, "text"], o.text));
            if (!/^\d+$/.test(q.answer) || Number(q.answer) >= q.options.length) {
                ctx.addIssue({ code: "custom", path: ["answer"], message: "Pick the right option" });
            }
        }
        if (q.kind === "gap") {
            const gaps = q.sentence.split("___").length - 1;
            if (gaps !== 1 || /_/.test(q.sentence.replace("___", ""))) {
                ctx.addIssue({ code: "custom", path: ["sentence"], message: "Write exactly one gap as ___" });
            }
            if (q.answers.length === 0) {
                ctx.addIssue({ code: "custom", path: ["answers"], message: "Add at least one accepted answer" });
            }
            q.answers.forEach((a, i) => need(["answers", i, "text"], a.text));
        }
        if (q.kind === "order") {
            need(["vi"], q.vi);
            need(["orderAnswer"], q.orderAnswer);
        }
    });

export type QuestionFormValues = z.infer<typeof questionFormSchema>;

/** A placement question must name its unit. */
export const placementQuestionFormSchema = questionFormSchema.superRefine((q, ctx) => {
    if (!q.unit) ctx.addIssue({ code: "custom", path: ["unit"], message: "Pick the unit it probes" });
});

export function emptyQuestionForm(kind: QuestionKind = "choice", unit = ""): QuestionFormValues {
    return {
        kind,
        unit,
        item: "",
        explanationVi: "",
        prompt: "",
        audioText: "",
        options: [{ text: "" }, { text: "" }, { text: "" }],
        answer: "",
        sentence: "",
        hintVi: "",
        answers: [{ text: "" }],
        vi: "",
        orderAnswer: "",
    };
}

const optional = (key: string, value: string) => (value.trim() ? { [key]: value.trim() } : {});

/** Form → record. Assumes the form passed the schema; `withUnit` for placement questions. */
export function questionFormToRecord(q: QuestionFormValues, { withUnit = false } = {}): AdminRecordBody {
    const shared = { ...optional("item", q.item), ...optional("explanationVi", q.explanationVi) };
    const unit = withUnit ? { unit: q.unit } : {};
    switch (q.kind) {
        case "choice":
            return {
                ...unit,
                kind: "choice",
                prompt: q.prompt.trim(),
                ...optional("audioText", q.audioText),
                options: q.options.map((o) => o.text.trim()),
                answer: Number(q.answer),
                ...shared,
            };
        case "gap":
            return {
                ...unit,
                kind: "gap",
                sentence: q.sentence.trim(),
                ...optional("hintVi", q.hintVi),
                answers: q.answers.map((a) => a.text.trim()),
                ...shared,
            };
        case "order":
            return { ...unit, kind: "order", vi: q.vi.trim(), answer: q.orderAnswer.trim(), ...shared };
    }
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const texts = (v: unknown) => (Array.isArray(v) ? v.map((t) => ({ text: str(t) })) : []);

/** Record (as the API returns it) → form. An unknown kind opens as an empty choice. */
export function recordToQuestionForm(r: AdminRecordBody): QuestionFormValues {
    const kind = QUESTION_KINDS.includes(r.kind as QuestionKind) ? (r.kind as QuestionKind) : "choice";
    const empty = emptyQuestionForm(kind, str(r.unit));
    const shared = { ...empty, item: str(r.item), explanationVi: str(r.explanationVi) };
    switch (kind) {
        case "choice":
            return {
                ...shared,
                prompt: str(r.prompt),
                audioText: str(r.audioText),
                options: texts(r.options),
                answer: typeof r.answer === "number" ? String(r.answer) : "",
            };
        case "gap":
            return { ...shared, sentence: str(r.sentence), hintVi: str(r.hintVi), answers: texts(r.answers) };
        case "order":
            return { ...shared, vi: str(r.vi), orderAnswer: str(r.answer) };
    }
}

/** The words an order question shuffles, as the learner will see them. */
export function orderTiles(answer: string): string[] {
    return answer.trim().split(/\s+/).filter(Boolean);
}

// ─── Unit test (checkpoint) ─────────────────────────────────────────────────

export const checkpointFormSchema = z.object({
    slug: z.string().trim().regex(SLUG, "Lowercase words joined by hyphens, like a1-03-checkpoint"),
    unit: required,
    passPercent: z.string().refine((v) => /^\d+$/.test(v) && +v >= 1 && +v <= 100, "1 to 100"),
    questions: z.array(questionFormSchema).min(1, "Add at least one question"),
});
export type CheckpointFormValues = z.infer<typeof checkpointFormSchema>;

export function emptyCheckpointForm(unit = ""): CheckpointFormValues {
    return { slug: unit ? `${unit}-checkpoint` : "", unit, passPercent: "70", questions: [emptyQuestionForm()] };
}

export function checkpointFormToRecord(v: CheckpointFormValues): AdminRecordBody {
    return {
        slug: v.slug.trim(),
        unit: v.unit,
        passPercent: Number(v.passPercent),
        questions: v.questions.map((q) => questionFormToRecord(q)),
    };
}

export function recordToCheckpointForm(r: AdminRecordBody): CheckpointFormValues {
    return {
        slug: str(r.slug),
        unit: str(r.unit),
        passPercent: String(r.passPercent ?? 70),
        questions: (Array.isArray(r.questions) ? (r.questions as AdminRecordBody[]) : []).map(recordToQuestionForm),
    };
}

// ─── Placement test ─────────────────────────────────────────────────────────

export const placementFormSchema = z.object({
    slug: z.string().trim().regex(SLUG, "Lowercase words joined by hyphens, like path-placement"),
    title: required,
    questions: z.array(placementQuestionFormSchema).min(1, "Add at least one question"),
});
export type PlacementFormValues = z.infer<typeof placementFormSchema>;

export function emptyPlacementForm(): PlacementFormValues {
    return { slug: "", title: "Placement test", questions: [emptyQuestionForm()] };
}

export function placementFormToRecord(v: PlacementFormValues): AdminRecordBody {
    return {
        slug: v.slug.trim(),
        title: v.title.trim(),
        questions: v.questions.map((q) => questionFormToRecord(q, { withUnit: true })),
    };
}

export function recordToPlacementForm(r: AdminRecordBody): PlacementFormValues {
    return {
        slug: str(r.slug),
        title: str(r.title),
        questions: (Array.isArray(r.questions) ? (r.questions as AdminRecordBody[]) : []).map(recordToQuestionForm),
    };
}

/**
 * What the server's placement rules will refuse, said early: a probed unit
 * needs at least 2 questions, and questions go in path order (`unitOrder` is
 * the units' slugs in path order).
 */
export function placementWarnings(questions: readonly { unit: string }[], unitOrder: readonly string[]): string[] {
    const warnings: string[] = [];
    const count = new Map<string, number>();
    for (const q of questions) if (q.unit) count.set(q.unit, (count.get(q.unit) ?? 0) + 1);
    for (const [unit, n] of count) if (n < 2) warnings.push(`${unit} has only ${n} question; each probed unit needs at least 2.`);
    const position = new Map(unitOrder.map((slug, i) => [slug, i]));
    let last = -1;
    for (const [i, q] of questions.entries()) {
        const at = position.get(q.unit);
        if (at === undefined) continue;
        if (at < last) {
            warnings.push(`Question ${i + 1} (${q.unit}) comes after a later unit; keep questions in path order.`);
            break;
        }
        last = at;
    }
    return warnings;
}
