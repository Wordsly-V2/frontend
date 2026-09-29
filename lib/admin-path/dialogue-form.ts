import { z } from "zod";
import { SLUG } from "@/lib/admin-path/question-form";
import type { AdminRecordBody } from "@/types/admin-path/admin-path.type";

/**
 * The dialogue editor's form ⇄ a dialogue record in seed shape (curriculum-service
 * `dialogueSchema` + `unit`). `learnerTurn` is written only when true (the
 * seed never says false), so an unchanged dialogue hashes the same.
 */

const required = z.string().trim().min(1, "Required");

export const dialogueFormSchema = z.object({
    slug: z.string().trim().regex(SLUG, "Lowercase words joined by hyphens, like a1-03-at-the-cafe"),
    unit: required,
    title: required,
    situationVi: required,
    lines: z
        .array(z.object({ speaker: required, en: required, vi: required, learnerTurn: z.boolean() }))
        .min(2, "A dialogue needs at least 2 lines"),
});

export type DialogueFormValues = z.infer<typeof dialogueFormSchema>;
export type DialogueLineForm = DialogueFormValues["lines"][number];

export function emptyDialogueLine(speaker = "", learnerTurn = false): DialogueLineForm {
    return { speaker, en: "", vi: "", learnerTurn };
}

export function emptyDialogueForm(unit = ""): DialogueFormValues {
    return { slug: "", unit, title: "", situationVi: "", lines: [emptyDialogueLine(), emptyDialogueLine("You", true)] };
}

/** Form → record. Assumes the form passed `dialogueFormSchema`. */
export function dialogueFormToRecord(v: DialogueFormValues): AdminRecordBody {
    return {
        slug: v.slug.trim(),
        unit: v.unit,
        title: v.title.trim(),
        situationVi: v.situationVi.trim(),
        lines: v.lines.map((l) => ({
            speaker: l.speaker.trim(),
            en: l.en.trim(),
            vi: l.vi.trim(),
            ...(l.learnerTurn && { learnerTurn: true }),
        })),
    };
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

export function recordToDialogueForm(r: AdminRecordBody): DialogueFormValues {
    return {
        slug: str(r.slug),
        unit: str(r.unit),
        title: str(r.title),
        situationVi: str(r.situationVi),
        lines: (Array.isArray(r.lines) ? (r.lines as AdminRecordBody[]) : []).map((l) => ({
            speaker: str(l.speaker),
            en: str(l.en),
            vi: str(l.vi),
            learnerTurn: l.learnerTurn === true,
        })),
    };
}

/** The speakers so far, first appearance first: the picks for a new line. */
export function dialogueSpeakers(lines: readonly { speaker: string }[]): string[] {
    return [...new Set(lines.map((l) => l.speaker.trim()).filter(Boolean))];
}

/** Who speaks next: the other speaker of a two-person dialogue, else nobody yet. */
export function nextSpeaker(lines: readonly DialogueLineForm[]): DialogueLineForm {
    const last = lines.at(-1);
    const before = lines.findLast((l) => l.speaker.trim() && l.speaker.trim() !== last?.speaker.trim());
    return emptyDialogueLine(before?.speaker.trim() ?? "", before?.learnerTurn ?? false);
}
