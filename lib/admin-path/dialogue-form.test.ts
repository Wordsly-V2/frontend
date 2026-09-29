import { describe, expect, it } from "vitest";
import {
    dialogueFormSchema,
    dialogueFormToRecord,
    dialogueSpeakers,
    emptyDialogueForm,
    nextSpeaker,
    recordToDialogueForm,
} from "@/lib/admin-path/dialogue-form";

// A dialogue as the admin API returns it (seed shape + unit).
const dialogue = {
    slug: "a1-03-at-the-cafe",
    title: "At the café",
    situationVi: "Lan gọi đồ uống.",
    lines: [
        { speaker: "Waiter", en: "Hi! What would you like?", vi: "Chào bạn! Bạn muốn dùng gì?" },
        { speaker: "Lan", en: "I'd like a coffee, please.", vi: "Cho mình một ly cà phê.", learnerTurn: true },
        { speaker: "Waiter", en: "Sure.", vi: "Vâng." },
    ],
    unit: "a1-03-food-and-drink",
};

describe("dialogue form", () => {
    it("round-trips a dialogue unchanged, so saving it is a no-op", () => {
        const form = recordToDialogueForm(dialogue);
        expect(dialogueFormSchema.safeParse(form).success).toBe(true);
        expect(dialogueFormToRecord(form)).toEqual(dialogue);
    });

    it("needs 2 filled lines", () => {
        const form = emptyDialogueForm("u");
        expect(form.unit).toBe("u");
        const issues = dialogueFormSchema.safeParse({ ...form, lines: form.lines.slice(0, 1) }).error?.issues.map((i) => i.path.join("."));
        expect(issues).toContain("lines");
        expect(issues).toContain("lines.0.en");
    });

    it("suggests the other speaker for the next line", () => {
        const form = recordToDialogueForm(dialogue);
        expect(dialogueSpeakers(form.lines)).toEqual(["Waiter", "Lan"]);
        expect(nextSpeaker(form.lines)).toMatchObject({ speaker: "Lan", learnerTurn: true });
        expect(nextSpeaker([]).speaker).toBe("");
    });
});
