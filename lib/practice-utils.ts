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

/** Build a fill-in-the-blank sentence from a random matching example. */
export function getClozePrompt(word: IWord): ClozePrompt | null {
    const examples = getWordExamples(word);
    const target = word.word.trim();
    if (!target) return null;

    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const re = new RegExp(escaped, "i");
    const matching = examples.filter((s) => re.test(s));
    if (matching.length === 0) return null;

    const match = matching[Math.floor(Math.random() * matching.length)];
    const sentence = match.replace(new RegExp(escaped, "gi"), "_____");
    return { sentence, answer: target };
}

/**
 * Pick distractor texts + the correct answer for a choice question.
 *
 * - No duplicate options: texts are deduped case-insensitively and the correct
 *   answer's text can never also appear as a distractor.
 * - Rotation: when a `recentlyUsed` set is passed, distractors not shown in
 *   recent questions are preferred so the same options don't keep reappearing.
 *   Once the fresh pool runs dry the rotation resets and a new cycle begins.
 */
function pickChoiceOptions(
    correctText: string,
    poolTexts: string[],
    optionCount: number,
    recentlyUsed?: Set<string>,
): string[] {
    // Unique, non-empty distractor texts that aren't the correct answer.
    const seen = new Set<string>([normalizeAnswer(correctText)]);
    const candidates: string[] = [];
    for (const text of poolTexts) {
        const key = normalizeAnswer(text);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        candidates.push(text);
    }

    const need = Math.min(optionCount - 1, candidates.length);
    const used = recentlyUsed ?? new Set<string>();

    let fresh = shuffleArray(candidates.filter((t) => !used.has(normalizeAnswer(t))));
    // Not enough unused distractors left — reset rotation and start a new cycle.
    if (fresh.length < need) {
        used.clear();
        fresh = shuffleArray(candidates);
    }

    const chosen = fresh.slice(0, need);
    for (const text of chosen) used.add(normalizeAnswer(text));

    return shuffleArray([correctText, ...chosen]);
}

/** Build word options for cloze/word-bank quiz (correct word + rotating distractors). */
export function generateWordChoiceOptions(
    correctWord: IWord,
    pool: IWord[],
    optionCount = 4,
    recentlyUsed?: Set<string>,
): string[] {
    const poolTexts = pool.filter((w) => w.id !== correctWord.id).map((w) => w.word);
    return pickChoiceOptions(correctWord.word, poolTexts, optionCount, recentlyUsed);
}

export function normalizeAnswer(value: string): string {
    return value.trim().toLowerCase().replaceAll(/\s+/g, " ");
}

/** Strip accents/diacritics so "café" and "cafe" compare equal. */
function stripDiacritics(value: string): string {
    return value.normalize("NFD").replaceAll(/[\u0300-\u036f]/g, "");
}

/** Levenshtein edit distance between two strings (insert/delete/substitute = 1). */
export function levenshteinDistance(a: string, b: string): number {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    let curr = new Array<number>(b.length + 1);
    for (let i = 1; i <= a.length; i++) {
        curr[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
        }
        [prev, curr] = [curr, prev];
    }
    return prev[b.length];
}

export type AnswerMatch = "exact" | "near" | "wrong";

/**
 * Grade a typed answer against the expected word with typo tolerance.
 * "near" = a small spelling slip (or a missing accent) — counted as correct
 * so a single-letter typo doesn't punish the learner. Tolerance scales with
 * length; very short words demand an exact match (a typo becomes another word).
 */
export function getAnswerMatch(userAnswer: string, expected: string): AnswerMatch {
    const user = normalizeAnswer(userAnswer);
    const target = normalizeAnswer(expected);
    if (!user || !target) return "wrong";
    if (user === target) return "exact";

    const userBase = stripDiacritics(user);
    const targetBase = stripDiacritics(target);
    if (userBase === targetBase) return "near"; // only accents differ

    // Allowed edits grow with word length; short words stay strict.
    let allowed = 0;
    if (targetBase.length >= 8) allowed = 2;
    else if (targetBase.length >= 4) allowed = 1;
    if (allowed === 0) return "wrong";

    return levenshteinDistance(userBase, targetBase) <= allowed ? "near" : "wrong";
}

/** Like normalize but only trims leading whitespace for hint prefix matching. */
export function normalizeForHintPrefix(value: string): string {
    return value.trimStart().toLowerCase().replaceAll(/\s+/g, " ");
}
