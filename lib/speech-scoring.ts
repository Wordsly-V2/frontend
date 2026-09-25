import { AnswerQuality } from "@/types/word-progress/word-progress.type";

/**
 * Scores what the learner said (speech-recognition transcripts) against the
 * sentence they were asked to say.
 *
 * Both sides go through the same normalisation, so the comparison is about
 * words, not about how the recogniser chose to write them: case, punctuation,
 * curly apostrophes, contractions ("I'm" = "I am") and digits ("7:00" =
 * "seven o'clock") never cost a point. Then it is a word-level edit distance:
 * a missing, extra or different word is one mistake.
 */

export interface SpokenWord {
    /** The expected word, as written in the sentence. */
    word: string;
    /** Heard in the right place. */
    matched: boolean;
}

export interface SpeechScore {
    /** 0–1: share of the expected words said correctly, less extra words. */
    accuracy: number;
    quality: AnswerQuality;
    /** The expected sentence word by word, for highlighting what was missed. */
    words: SpokenWord[];
    /** The transcript the score came from (the best of the alternatives). */
    heard: string;
}

// Accuracy needed for each quality; the pass line (3) matches
// `isCorrectAnswer` in `lib/answer-quality.ts`.
const QUALITY_STEPS: [number, AnswerQuality][] = [
    [0.95, AnswerQuality.PERFECT],
    [0.85, AnswerQuality.CORRECT_WITH_HESITATION],
    [0.7, AnswerQuality.CORRECT_WITH_DIFFICULTY],
    [0.5, AnswerQuality.INCORRECT_BUT_EASY],
];

export function accuracyToQuality(accuracy: number): AnswerQuality {
    for (const [min, quality] of QUALITY_STEPS) {
        if (accuracy >= min) return quality;
    }
    return accuracy > 0 ? AnswerQuality.INCORRECT : AnswerQuality.COMPLETE_BLACKOUT;
}

const CONTRACTIONS: [RegExp, string][] = [
    [/\bcan't\b/g, "can not"],
    [/\bcannot\b/g, "can not"],
    [/\bwon't\b/g, "will not"],
    [/\blet's\b/g, "let us"],
    [/n't\b/g, " not"],
    [/'m\b/g, " am"],
    [/'re\b/g, " are"],
    [/'ve\b/g, " have"],
    [/'ll\b/g, " will"],
    [/'d\b/g, " would"],
    // "'s" is "is", "has" or a possessive; expanding it the same way on both
    // sides keeps "It's" and "It is" equal without having to tell them apart.
    [/'s\b/g, " is"],
];

const ONES = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** 0–999,999 in words, without "and": 105 → "one hundred five". */
export function numberToWords(n: number): string {
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : "");
    if (n < 1000) {
        const rest = n % 100;
        return `${ONES[Math.floor(n / 100)]} hundred${rest ? ` ${numberToWords(rest)}` : ""}`;
    }
    const rest = n % 1000;
    return `${numberToWords(Math.floor(n / 1000))} thousand${rest ? ` ${numberToWords(rest)}` : ""}`;
}

/** Lower-case words with contractions expanded, digits spelled out and punctuation gone. */
export function normalizeSpeech(text: string): string[] {
    let s = text.toLowerCase().replace(/[’‘`]/g, "'");
    // Recognisers write times as "7:00" / "7:30" for "seven o'clock" / "seven thirty".
    s = s.replace(/\b(\d{1,2}):00\b/g, "$1 o'clock").replace(/\b(\d{1,2}):(\d{2})\b/g, "$1 $2");
    s = s.replace(/(\d),(?=\d{3}\b)/g, "$1"); // 10,000 → 10000
    s = s.replace(/\b\d{1,6}\b/g, (d) => ` ${numberToWords(Number(d))} `);
    for (const [pattern, replacement] of CONTRACTIONS) s = s.replace(pattern, replacement);
    // "o'clock" and anything else still holding an apostrophe become one word.
    s = s.replace(/'/g, "");
    // Hyphens join words ("T-shirt", "twenty-one"); recognisers drop them.
    s = s.replace(/-/g, " ");
    return s.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

/**
 * Word-level alignment of `heard` against `expected`: the edit distance and,
 * for each expected word, whether it was heard in place.
 */
function align(expected: string[], heard: string[]): { distance: number; matched: boolean[] } {
    const rows = expected.length + 1;
    const cols = heard.length + 1;
    const d: number[][] = Array.from({ length: rows }, (_, i) =>
        Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );
    for (let i = 1; i < rows; i++) {
        for (let j = 1; j < cols; j++) {
            const same = expected[i - 1] === heard[j - 1] ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + same);
        }
    }

    const matched = new Array<boolean>(expected.length).fill(false);
    let i = expected.length;
    let j = heard.length;
    while (i > 0 && j > 0) {
        if (expected[i - 1] === heard[j - 1] && d[i][j] === d[i - 1][j - 1]) {
            matched[i - 1] = true;
            i--;
            j--;
        } else if (d[i][j] === d[i - 1][j - 1] + 1) {
            i--;
            j--;
        } else if (d[i][j] === d[i - 1][j] + 1) {
            i--;
        } else {
            j--;
        }
    }
    return { distance: d[rows - 1][cols - 1], matched };
}

/**
 * Maps each normalised word back onto the written sentence, so the result can
 * be shown with the learner's own spelling ("I'm" stays one word even though
 * it was scored as "i am": it counts as matched only if both parts were).
 */
function toWrittenWords(expected: string, matched: boolean[]): SpokenWord[] {
    const written = expected.split(/\s+/).filter(Boolean);
    const out: SpokenWord[] = [];
    let k = 0;
    for (const word of written) {
        const parts = normalizeSpeech(word).length;
        const slice = matched.slice(k, k + parts);
        out.push({ word, matched: parts === 0 || slice.every(Boolean) });
        k += parts;
    }
    return out;
}

function scoreOne(expected: string, transcript: string): SpeechScore {
    const want = normalizeSpeech(expected);
    const got = normalizeSpeech(transcript);
    const { distance, matched } = align(want, got);
    const accuracy = want.length === 0 ? 0 : Math.max(0, 1 - distance / want.length);
    return {
        accuracy,
        quality: accuracyToQuality(accuracy),
        words: toWrittenWords(expected, matched),
        heard: transcript,
    };
}

/**
 * The best score over the recogniser's alternatives (it often returns the
 * right sentence as its second guess). `null` when nothing was heard.
 */
export function scoreSpeech(expected: string, transcripts: readonly string[]): SpeechScore | null {
    const heard = transcripts.filter((t) => t.trim().length > 0);
    if (heard.length === 0) return null;
    return heard
        .map((t) => scoreOne(expected, t))
        .reduce((best, s) => (s.accuracy > best.accuracy ? s : best));
}
