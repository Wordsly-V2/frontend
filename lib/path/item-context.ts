import type { ClozePrompt } from "@/lib/practice-utils";
import type { PathDialogue, PathItem } from "@/types/path/path.type";

/**
 * Fill-in prompts for a Wordsly Path item, with enough context to answer.
 *
 * The engine's own cloze blanks the item in its example, which for a phrase can
 * leave nothing to go on ("Hi! _____"). Path content has more: the lesson's
 * dialogues and a Vietnamese translation of every example. A dialogue turn wins
 * (the line before and the reply after pin the answer down); otherwise the
 * example is shown with its translation as the clue.
 */

const BLANK = "_____";

function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

/**
 * The item as it can appear in a sentence: frames like "What's more, …" or
 * "by the end of …" lose the ellipsis, which no sentence contains.
 */
export function pathAnswerText(text: string): string {
    return text.trim().replace(/^…\s*/, "").replace(/[\s,]*…$/, "").trim();
}

/**
 * `text` with every case-insensitive `target` blanked, or null if absent. Whole
 * words only, so "hi" never blanks the middle of "this".
 */
function blankOut(text: string, target: string): string | null {
    const trimmed = target.trim();
    if (!trimmed) return null;
    const start = /^\w/.test(trimmed) ? String.raw`(?<![\w'])` : "";
    const end = /\w$/.test(trimmed) ? String.raw`(?![\w'])` : "";
    const re = new RegExp(start + escapeRegExp(trimmed) + end, "gi");
    if (!re.test(text)) return null;
    return text.replace(re, BLANK);
}

function dialoguePrompts(item: PathItem, dialogues: PathDialogue[]): ClozePrompt[] {
    const prompts: ClozePrompt[] = [];
    for (const dialogue of dialogues) {
        const { lines } = dialogue;
        lines.forEach((line, i) => {
            const sentence = blankOut(line.en, pathAnswerText(item.text));
            // A lone line is no better than the bare example.
            if (!sentence || lines.length < 2) return;
            const before = lines[i - 1];
            const after = lines[i + 1];
            prompts.push({
                sentence,
                answer: pathAnswerText(item.text),
                example: {
                    id: `${dialogue.id}:${i}`,
                    text: line.en,
                    ...(line.vi ? { translation: line.vi } : {}),
                },
                context: {
                    situationVi: dialogue.situationVi || undefined,
                    translationVi: line.vi || undefined,
                    lines: [
                        ...(before ? [{ speaker: before.speaker, en: before.en }] : []),
                        { speaker: line.speaker, en: sentence, target: true },
                        ...(after ? [{ speaker: after.speaker, en: after.en }] : []),
                    ],
                },
            });
        });
    }
    return prompts;
}

function examplePrompts(item: PathItem): ClozePrompt[] {
    return item.examples.flatMap((example, i) => {
        // Blank the item itself; when the sentence uses another form of it
        // ("rose" for "rise"), the author's highlight marks that form.
        const text = pathAnswerText(item.text);
        const highlight = example.highlight?.trim() ?? "";
        let target = text;
        let sentence = blankOut(example.en, text);
        if (!sentence && highlight) {
            target = highlight;
            sentence = blankOut(example.en, highlight);
        }
        if (!sentence) return [];
        return [
            {
                sentence,
                answer: target,
                example: {
                    id: `${item.id}:ex${i}`,
                    text: example.en,
                    ...(example.vi ? { translation: example.vi } : {}),
                },
                context: example.vi ? { translationVi: example.vi } : undefined,
            },
        ];
    });
}

/**
 * Candidate fill-in prompts for `item`: dialogue turns when the lesson's
 * dialogues use it, else its examples with their translations. Empty when the
 * item appears in neither, so the engine falls back to another exercise.
 */
export function buildPathClozePrompts(
    item: PathItem,
    dialogues: PathDialogue[] = [],
): ClozePrompt[] {
    const fromDialogues = dialoguePrompts(item, dialogues);
    return fromDialogues.length > 0 ? fromDialogues : examplePrompts(item);
}
