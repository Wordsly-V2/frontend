import { z } from "zod";
import type { AdminRecordBody } from "@/types/admin-path/admin-path.type";

/**
 * The item editor's form ⇄ an item record in seed shape (curriculum-service
 * `itemSchema` + `unit`). The form keeps everything as strings, lists as one
 * entry per line or comma-separated; the record drops empty optional fields
 * (the seed has no nulls, and an empty `collocations` must be absent) so that
 * saving an unchanged item hashes the same and changes nothing.
 */

export const ITEM_TYPES = ["LEXICAL", "PHRASE", "PATTERN", "GRAMMAR"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const required = z.string().trim().min(1, "Required");

export const itemFormSchema = z
    .object({
        slug: z.string().trim().regex(SLUG, "Lowercase words joined by hyphens, like good-morning"),
        unit: required,
        type: z.enum(ITEM_TYPES),
        text: required,
        meaningVi: required,
        ipa: z.string(),
        audioUrl: z.string().trim().refine((v) => v === "" || URL.canParse(v), "Must be a full URL"),
        noteVi: z.string(),
        collocations: z.string(),
        examples: z.array(z.object({ en: required, vi: required, highlight: z.string() })),
        pattern: z.object({
            template: z.string(),
            slots: z.array(
                z.object({
                    name: z.string().trim().regex(/^[a-z][a-zA-Z]*$/, "Like thing or placeName"),
                    hintVi: required,
                    options: required,
                }),
            ),
        }),
        grammar: z.object({
            ruleVi: z.string(),
            forms: z.array(z.object({ label: required, example: required })),
            pitfallsVi: z.string(),
        }),
    })
    .superRefine((v, ctx) => {
        for (const [i, ex] of v.examples.entries()) {
            if (ex.highlight.trim() && !ex.en.toLowerCase().includes(ex.highlight.trim().toLowerCase())) {
                ctx.addIssue({ code: "custom", path: ["examples", i, "highlight"], message: "Must appear in the sentence" });
            }
        }
        if (v.type === "PATTERN") {
            if (!v.pattern.template.trim()) {
                ctx.addIssue({ code: "custom", path: ["pattern", "template"], message: "Required for a pattern" });
            }
            if (v.pattern.slots.length === 0) {
                ctx.addIssue({ code: "custom", path: ["pattern", "slots"], message: "A pattern needs at least one slot" });
            }
            const inTemplate = new Set([...v.pattern.template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
            for (const [i, slot] of v.pattern.slots.entries()) {
                if (slot.name && !inTemplate.has(slot.name)) {
                    ctx.addIssue({ code: "custom", path: ["pattern", "slots", i, "name"], message: `{${slot.name}} is not in the template` });
                }
            }
        }
        if (v.type === "GRAMMAR") {
            if (!v.grammar.ruleVi.trim()) {
                ctx.addIssue({ code: "custom", path: ["grammar", "ruleVi"], message: "Required for a grammar point" });
            }
            if (v.grammar.forms.length === 0) {
                ctx.addIssue({ code: "custom", path: ["grammar", "forms"], message: "Add at least one form" });
            }
        }
    });

export type ItemFormValues = z.infer<typeof itemFormSchema>;

export function emptyItemForm(unit = ""): ItemFormValues {
    return {
        slug: "",
        unit,
        type: "LEXICAL",
        text: "",
        meaningVi: "",
        ipa: "",
        audioUrl: "",
        noteVi: "",
        collocations: "",
        examples: [{ en: "", vi: "", highlight: "" }],
        pattern: { template: "", slots: [] },
        grammar: { ruleVi: "", forms: [], pitfallsVi: "" },
    };
}

const lines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);
const commaList = (text: string) => text.split(",").map((p) => p.trim()).filter(Boolean);
const str = (v: unknown) => (typeof v === "string" ? v : "");
const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Form → record. Assumes the form passed `itemFormSchema`. */
export function itemFormToRecord(v: ItemFormValues): AdminRecordBody {
    const record: AdminRecordBody = {
        slug: v.slug.trim(),
        unit: v.unit,
        type: v.type,
        text: v.text.trim(),
        meaningVi: v.meaningVi.trim(),
        examples: v.examples.map((ex) => ({
            en: ex.en.trim(),
            vi: ex.vi.trim(),
            ...(ex.highlight.trim() && { highlight: ex.highlight.trim() }),
        })),
    };
    if (v.ipa.trim()) record.ipa = v.ipa.trim();
    if (v.audioUrl.trim()) record.audioUrl = v.audioUrl.trim();
    if (v.noteVi.trim()) record.noteVi = v.noteVi.trim();
    const collocations = lines(v.collocations);
    if (collocations.length > 0) record.collocations = collocations;
    if (v.type === "PATTERN") {
        record.pattern = {
            template: v.pattern.template.trim(),
            slots: v.pattern.slots.map((s) => ({
                name: s.name.trim(),
                hintVi: s.hintVi.trim(),
                options: commaList(s.options),
            })),
        };
    }
    if (v.type === "GRAMMAR") {
        record.grammar = {
            ruleVi: v.grammar.ruleVi.trim(),
            forms: v.grammar.forms.map((f) => ({ label: f.label.trim(), example: f.example.trim() })),
            pitfallsVi: lines(v.grammar.pitfallsVi),
        };
    }
    return record;
}

/** Record (as the API returns it) → form. Unknown shapes fall back to empty fields. */
export function recordToItemForm(r: AdminRecordBody): ItemFormValues {
    const pattern = (r.pattern ?? {}) as Record<string, unknown>;
    const grammar = (r.grammar ?? {}) as Record<string, unknown>;
    const type = ITEM_TYPES.includes(r.type as ItemType) ? (r.type as ItemType) : "LEXICAL";
    return {
        slug: str(r.slug),
        unit: str(r.unit),
        type,
        text: str(r.text),
        meaningVi: str(r.meaningVi),
        ipa: str(r.ipa),
        audioUrl: str(r.audioUrl),
        noteVi: str(r.noteVi),
        collocations: list<string>(r.collocations).join("\n"),
        examples: list<Record<string, unknown>>(r.examples).map((ex) => ({
            en: str(ex.en),
            vi: str(ex.vi),
            highlight: str(ex.highlight),
        })),
        pattern: {
            template: str(pattern.template),
            slots: list<Record<string, unknown>>(pattern.slots).map((s) => ({
                name: str(s.name),
                hintVi: str(s.hintVi),
                options: list<string>(s.options).join(", "),
            })),
        },
        grammar: {
            ruleVi: str(grammar.ruleVi),
            forms: list<Record<string, unknown>>(grammar.forms).map((f) => ({ label: str(f.label), example: str(f.example) })),
            pitfallsVi: list<string>(grammar.pitfallsVi).join("\n"),
        },
    };
}
