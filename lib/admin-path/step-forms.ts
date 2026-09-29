import { z } from "zod";
import {
    questionFormSchema,
    questionFormToRecord,
    recordToQuestionForm,
    SLUG,
    type QuestionFormValues,
} from "@/lib/admin-path/question-form";
import type { AdminRecordBody } from "@/types/admin-path/admin-path.type";

/**
 * A lesson step (curriculum-service `stepPayloadSchemas`) ⇄ one flat form per
 * step: every type's fields are always there, and the payload keeps only the
 * chosen type's, minus empty optional ones, so an unchanged step round-trips
 * to the same payload. Lists whose order is content (items, modes) keep it.
 */

export const STEP_TYPES = ["WARMUP", "INTRO", "EXPLAIN", "PRACTICE", "PATTERN_DRILL", "SPEAK", "DIALOGUE", "QUIZ"] as const;
export type StepType = (typeof STEP_TYPES)[number];

export const STEP_TYPE_LABEL: Record<StepType, string> = {
    WARMUP: "Warm-up (review due items)",
    INTRO: "Intro (present new items)",
    EXPLAIN: "Explain (a note in Vietnamese)",
    PRACTICE: "Practice (drill items)",
    PATTERN_DRILL: "Pattern drill",
    SPEAK: "Speak (listen and repeat)",
    DIALOGUE: "Dialogue",
    QUIZ: "Quiz",
};

/** curriculum-service `PRACTICE_MODES`: the practice engine's concrete modes. */
export const PRACTICE_MODES = ["flashcard", "context", "word-bank", "listening", "cloze", "sentence-build", "speaking"] as const;
export type PracticeModeName = (typeof PRACTICE_MODES)[number];

export const DIALOGUE_MODES = ["listen", "roleplay"] as const;

const SCHEMA_VERSION = 1;

export const stepFormSchema = z
    .object({
        type: z.enum(STEP_TYPES),
        // WARMUP
        maxItems: z.string(),
        // INTRO, PRACTICE, EXPLAIN (optional there)
        items: z.array(z.object({ slug: z.string() })),
        // EXPLAIN
        titleVi: z.string(),
        bodyVi: z.string(),
        examples: z.array(z.object({ en: z.string(), vi: z.string(), highlight: z.string() })),
        // PRACTICE
        modes: z.array(z.enum(PRACTICE_MODES)),
        // PATTERN_DRILL
        pattern: z.string(),
        prompts: z.array(
            z.object({
                cueVi: z.string(),
                slots: z.array(z.object({ name: z.string(), value: z.string() })),
                answer: z.string(),
            }),
        ),
        // SPEAK
        lines: z.array(z.object({ en: z.string(), vi: z.string() })),
        // DIALOGUE
        dialogue: z.string(),
        mode: z.enum(DIALOGUE_MODES),
        // QUIZ: checked below, and only for a quiz, so questions left over
        // from switching a step's type don't block saving.
        questions: z.array(z.custom<QuestionFormValues>()),
    })
    .superRefine((s, ctx) => {
        const need = (path: (string | number)[], value: string, message = "Required") => {
            if (!value.trim()) ctx.addIssue({ code: "custom", path, message });
        };
        const atLeastOne = (path: string, length: number, message: string) => {
            if (length === 0) ctx.addIssue({ code: "custom", path: [path], message });
        };
        const slugs = (required: boolean) => {
            if (required) atLeastOne("items", s.items.length, "Pick at least one item");
            s.items.forEach((item, i) => {
                if (!SLUG.test(item.slug)) ctx.addIssue({ code: "custom", path: ["items", i, "slug"], message: "An item slug" });
            });
        };
        switch (s.type) {
            case "WARMUP":
                if (!/^\d+$/.test(s.maxItems) || +s.maxItems < 1 || +s.maxItems > 30) {
                    ctx.addIssue({ code: "custom", path: ["maxItems"], message: "1 to 30" });
                }
                break;
            case "INTRO":
            case "PRACTICE":
                slugs(true);
                if (s.type === "PRACTICE") atLeastOne("modes", s.modes.length, "Pick at least one mode");
                break;
            case "EXPLAIN":
                need(["titleVi"], s.titleVi);
                need(["bodyVi"], s.bodyVi);
                slugs(false);
                s.examples.forEach((ex, i) => {
                    need(["examples", i, "en"], ex.en);
                    need(["examples", i, "vi"], ex.vi);
                    if (ex.highlight.trim() && !ex.en.toLowerCase().includes(ex.highlight.trim().toLowerCase())) {
                        ctx.addIssue({ code: "custom", path: ["examples", i, "highlight"], message: "Must appear in the English" });
                    }
                });
                break;
            case "PATTERN_DRILL":
                if (!SLUG.test(s.pattern.trim())) ctx.addIssue({ code: "custom", path: ["pattern"], message: "Pick a pattern" });
                atLeastOne("prompts", s.prompts.length, "Add at least one prompt");
                s.prompts.forEach((p, i) => {
                    need(["prompts", i, "cueVi"], p.cueVi);
                    need(["prompts", i, "answer"], p.answer);
                    const seen = new Set<string>();
                    p.slots.forEach((slot, j) => {
                        need(["prompts", i, "slots", j, "name"], slot.name);
                        need(["prompts", i, "slots", j, "value"], slot.value);
                        if (seen.has(slot.name.trim())) {
                            ctx.addIssue({ code: "custom", path: ["prompts", i, "slots", j, "name"], message: "Already filled" });
                        }
                        seen.add(slot.name.trim());
                    });
                });
                break;
            case "SPEAK":
                atLeastOne("lines", s.lines.length, "Add at least one sentence");
                s.lines.forEach((line, i) => {
                    need(["lines", i, "en"], line.en);
                    need(["lines", i, "vi"], line.vi);
                });
                break;
            case "DIALOGUE":
                need(["dialogue"], s.dialogue, "Pick a dialogue");
                break;
            case "QUIZ":
                atLeastOne("questions", s.questions.length, "Add at least one question");
                s.questions.forEach((q, i) => {
                    for (const issue of questionFormSchema.safeParse(q).error?.issues ?? []) {
                        ctx.addIssue({ code: "custom", path: ["questions", i, ...issue.path], message: issue.message });
                    }
                });
                break;
        }
    });

export type StepFormValues = z.infer<typeof stepFormSchema>;

export function emptyStepForm(type: StepType = "INTRO"): StepFormValues {
    return {
        type,
        maxItems: "8",
        items: [],
        titleVi: "",
        bodyVi: "",
        examples: [],
        modes: ["flashcard", "listening"],
        pattern: "",
        prompts: [{ cueVi: "", slots: [], answer: "" }],
        lines: [{ en: "", vi: "" }],
        dialogue: "",
        mode: "roleplay",
        questions: [],
    };
}

const slugList = (items: StepFormValues["items"]) => items.map((i) => i.slug.trim());

/** Form → `{ type, payload }`. Assumes the form passed `stepFormSchema`. */
export function stepFormToRecord(s: StepFormValues): AdminRecordBody {
    const base = { schemaVersion: SCHEMA_VERSION };
    const payload = (() => {
        switch (s.type) {
            case "WARMUP":
                return { ...base, maxItems: Number(s.maxItems) };
            case "INTRO":
                return { ...base, items: slugList(s.items) };
            case "EXPLAIN":
                return {
                    ...base,
                    titleVi: s.titleVi.trim(),
                    bodyVi: s.bodyVi.trim(),
                    ...(s.items.length > 0 && { items: slugList(s.items) }),
                    ...(s.examples.length > 0 && {
                        examples: s.examples.map((ex) => ({
                            en: ex.en.trim(),
                            vi: ex.vi.trim(),
                            ...(ex.highlight.trim() && { highlight: ex.highlight.trim() }),
                        })),
                    }),
                };
            case "PRACTICE":
                return { ...base, modes: [...s.modes], items: slugList(s.items) };
            case "PATTERN_DRILL":
                return {
                    ...base,
                    pattern: s.pattern.trim(),
                    prompts: s.prompts.map((p) => ({
                        cueVi: p.cueVi.trim(),
                        slots: Object.fromEntries(p.slots.map((slot) => [slot.name.trim(), slot.value.trim()])),
                        answer: p.answer.trim(),
                    })),
                };
            case "SPEAK":
                return { ...base, lines: s.lines.map((l) => ({ en: l.en.trim(), vi: l.vi.trim() })) };
            case "DIALOGUE":
                return { ...base, dialogue: s.dialogue, mode: s.mode };
            case "QUIZ":
                return { ...base, questions: s.questions.map((q) => questionFormToRecord(q)) };
        }
    })();
    return { type: s.type, payload };
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const obj = (v: unknown): Record<string, unknown> => (typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** `{ type, payload }` (as the API returns it) → form. An unknown type opens as an empty intro. */
export function recordToStepForm(r: AdminRecordBody): StepFormValues {
    const type = STEP_TYPES.includes(r.type as StepType) ? (r.type as StepType) : "INTRO";
    const p = obj(r.payload);
    const empty = emptyStepForm(type);
    const items = list<unknown>(p.items).map((slug) => ({ slug: str(slug) }));
    switch (type) {
        case "WARMUP":
            return { ...empty, maxItems: String(p.maxItems ?? 8) };
        case "INTRO":
            return { ...empty, items };
        case "EXPLAIN":
            return {
                ...empty,
                titleVi: str(p.titleVi),
                bodyVi: str(p.bodyVi),
                items,
                examples: list<Record<string, unknown>>(p.examples).map((ex) => ({
                    en: str(ex.en),
                    vi: str(ex.vi),
                    highlight: str(ex.highlight),
                })),
            };
        case "PRACTICE":
            return {
                ...empty,
                modes: list<string>(p.modes).filter((m): m is PracticeModeName => PRACTICE_MODES.includes(m as PracticeModeName)),
                items,
            };
        case "PATTERN_DRILL":
            return {
                ...empty,
                pattern: str(p.pattern),
                prompts: list<Record<string, unknown>>(p.prompts).map((prompt) => ({
                    cueVi: str(prompt.cueVi),
                    slots: Object.entries(obj(prompt.slots)).map(([name, value]) => ({ name, value: str(value) })),
                    answer: str(prompt.answer),
                })),
            };
        case "SPEAK":
            return { ...empty, lines: list<Record<string, unknown>>(p.lines).map((l) => ({ en: str(l.en), vi: str(l.vi) })) };
        case "DIALOGUE":
            return { ...empty, dialogue: str(p.dialogue), mode: p.mode === "listen" ? "listen" : "roleplay" };
        case "QUIZ":
            return { ...empty, questions: list<AdminRecordBody>(p.questions).map(recordToQuestionForm) };
    }
}

/** The `{slot}` names of a pattern template ("Did you {do}?" → ["do"]). */
export function templateSlots(template: string): string[] {
    return [...new Set([...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))];
}

/** A one-line summary of a step, for its folded header. */
export function stepSummary(s: StepFormValues | undefined): string {
    if (!s) return "";
    const n = (count: number, what: string) => `${count} ${what}${count === 1 ? "" : "s"}`;
    switch (s.type) {
        case "WARMUP":
            return `up to ${s.maxItems} due items`;
        case "INTRO":
        case "PRACTICE":
            return s.items.map((i) => i.slug).join(", ") || "(no items)";
        case "EXPLAIN":
            return s.titleVi.trim() || "(no title)";
        case "PATTERN_DRILL":
            return `${s.pattern || "(no pattern)"} · ${n(s.prompts.length, "prompt")}`;
        case "SPEAK":
            return n(s.lines.length, "sentence");
        case "DIALOGUE":
            return `${s.dialogue || "(no dialogue)"} · ${s.mode}`;
        case "QUIZ":
            return n(s.questions.length, "question");
    }
}
