import { IWord } from "@/types/courses/courses.type";

export const MASK_PLACEHOLDER = "***";

export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function getWordExamples(word: IWord): string[] {
    try {
        const ex = JSON.parse(word.example ?? "[]");
        return Array.isArray(ex) ? ex.filter((e): e is string => typeof e === "string") : [];
    } catch {
        return [];
    }
}

export function maskWordInExamples(word: string, examples: string[]): string[] {
    if (!word.trim()) return [];
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const re = new RegExp(escaped, "gi");
    return examples
        .filter((s) => re.test(s))
        .map((s) => s.replaceAll(new RegExp(escaped, "gi"), MASK_PLACEHOLDER));
}

export interface ClozePrompt {
    sentence: string;
    answer: string;
}

/** Build a fill-in-the-blank sentence from the first matching example. */
export function getClozePrompt(word: IWord): ClozePrompt | null {
    const examples = getWordExamples(word);
    const target = word.word.trim();
    if (!target) return null;

    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const re = new RegExp(escaped, "i");
    const match = examples.find((s) => re.test(s));
    if (!match) return null;

    const sentence = match.replace(new RegExp(escaped, "gi"), "_____");
    return { sentence, answer: target };
}

/** First visible character for cloze fallback when no example exists. */
export function getFirstLetterHint(word: string): string {
    const trimmed = word.trim();
    if (!trimmed) return "";
    return trimmed[0].toLowerCase();
}

export function normalizeAnswer(value: string): string {
    return value.trim().toLowerCase().replaceAll(/\s+/g, " ");
}

/** Like normalize but only trims leading whitespace for hint prefix matching. */
export function normalizeForHintPrefix(value: string): string {
    return value.trimStart().toLowerCase().replaceAll(/\s+/g, " ");
}
