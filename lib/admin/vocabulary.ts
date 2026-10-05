import type { MissingCounts } from "@/types/admin-vocabulary/admin-vocabulary.type";
import type { IWord } from "@/types/courses/courses.type";

/**
 * What a word lacks, by the same rules as vocabulary-service's content health
 * (`GET /admin/vocabulary/health`): blank counts as missing, and an example
 * list saved as `[]` counts as no example. Image is optional, so not a gap.
 */
export const WORD_GAPS = ["ipa", "audio", "meaning", "example"] as const;
export type WordGap = (typeof WORD_GAPS)[number];

export const GAP_LABELS: Record<keyof MissingCounts, string> = {
    ipa: "IPA",
    audio: "Audio",
    meaning: "Meaning",
    example: "Example",
    image: "Image",
};

/** The badge on a word that lacks something. */
export const GAP_BADGES: Record<WordGap, string> = {
    ipa: "No IPA",
    audio: "No audio",
    meaning: "No meaning",
    example: "No example",
};

/** "1 lesson", "3 lessons". */
export function countOf(count: number, singular: string, plural = `${singular}s`): string {
    return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

const blank = (value: string | null | undefined) => !value?.trim();

export function wordGaps(
    word: Pick<IWord, "pronunciation" | "ukIpa" | "usIpa" | "audioUrl" | "ukAudioUrl" | "usAudioUrl" | "meaning" | "example">,
): WordGap[] {
    const gaps: WordGap[] = [];
    if (blank(word.ukIpa) && blank(word.usIpa) && blank(word.pronunciation)) gaps.push("ipa");
    if (blank(word.audioUrl) && blank(word.ukAudioUrl) && blank(word.usAudioUrl)) gaps.push("audio");
    if (blank(word.meaning)) gaps.push("meaning");
    if (blank(word.example) || word.example?.trim() === "[]") gaps.push("example");
    return gaps;
}

/** The IPA to show for a word: UK, then US, then the plain pronunciation. */
export function wordIpa(word: Pick<IWord, "pronunciation" | "ukIpa" | "usIpa">): string | null {
    return [word.ukIpa, word.usIpa, word.pronunciation].find((value) => !blank(value))?.trim() ?? null;
}

/** "3 of 40 (8%)": a missing count with its share of all words. */
export function shareOf(count: number, total: number): string {
    if (total === 0) return "0";
    return `${count.toLocaleString()} of ${total.toLocaleString()} (${Math.round((count / total) * 100)}%)`;
}
