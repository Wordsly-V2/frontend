import { AnswerQuality } from "@/types/word-progress/word-progress.type";

/**
 * Scores what the learner said (speech-recognition transcripts) against the
 * sentence they were asked to say.
 *
 * Both sides go through the same normalisation, so the comparison is about
 * words, not about how the recogniser chose to write them: case, punctuation,
 * curly apostrophes, Vietnamese diacritics, contractions ("I'm" = "I am") and
 * numbers ("7:00" = "seven o'clock", "1st" = "first", "$5" = "five dollars")
 * never cost a point. A number that can be read several ways ("1998" as
 * "nineteen ninety eight", "105" as "one hundred and five") is tried every way.
 * Then it is a word-level edit distance: a missing, extra or different word is
 * one mistake, except that homophones ("two" / "to", "one" / "won") count as
 * the same word, since a recogniser can only guess which one was meant, and
 * Vietnamese names match whatever the recogniser made of them (an English
 * recogniser can't spell "Nguyễn"; the exercise is about the English).
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

/**
 * Words a recogniser can't tell apart by sound, and British / American
 * spellings of the same word. Each group compares equal; the recogniser picks
 * one spelling and the learner shouldn't lose a point for its guess.
 */
const SAME_WORDS: string[][] = [
    ["one", "won"],
    ["two", "to", "too"],
    ["four", "for", "fore"],
    ["eight", "ate"],
    ["zero", "oh", "o"],
    ["no", "know"],
    ["right", "write"],
    ["here", "hear"],
    ["there", "their"],
    ["by", "buy", "bye"],
    ["see", "sea"],
    ["i", "eye"],
    ["where", "wear"],
    ["weather", "whether"],
    ["meet", "meat"],
    ["week", "weak"],
    ["son", "sun"],
    ["new", "knew"],
    ["our", "hour"],
    ["road", "rode"],
    ["sale", "sail"],
    ["peace", "piece"],
    ["whole", "hole"],
    ["flour", "flower"],
    ["male", "mail"],
    ["pair", "pear"],
    ["break", "brake"],
    ["would", "wood"],
    ["blue", "blew"],
    ["through", "threw"],
    ["dear", "deer"],
    ["tail", "tale"],
    ["plain", "plane"],
    ["cent", "sent", "scent"],
    ["night", "knight"],
    ["made", "maid"],
    ["wait", "weight"],
    ["way", "weigh"],
    ["which", "witch"],
    ["ok", "okay"],
    ["mr", "mister"],
    ["mrs", "missus"],
    ["dr", "doctor"],
    ["mum", "mom"],
    ["grey", "gray"],
    ["colour", "color"],
    ["favourite", "favorite"],
    ["centre", "center"],
    ["theatre", "theater"],
    ["metre", "meter"],
    ["litre", "liter"],
    ["neighbour", "neighbor"],
    ["travelling", "traveling"],
    ["cancelled", "canceled"],
    ["programme", "program"],
    ["practise", "practice"],
    ["realise", "realize"],
    ["organise", "organize"],
    ["apologise", "apologize"],
    ["jewellery", "jewelry"],
];
const CANONICAL = new Map<string, string>(SAME_WORDS.flatMap((group) => group.map((w) => [w, group[0]])));

function sameWord(a: string, b: string): boolean {
    return a === b || (CANONICAL.get(a) ?? a) === (CANONICAL.get(b) ?? b);
}

const ONES = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/**
 * A whole number in words, American style without "and" (105 → "one hundred
 * five"); `withAnd` gives the British reading ("one hundred and five").
 */
export function numberToWords(n: number, withAnd = false): string {
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : "");
    const [size, name] = n < 1000 ? [100, "hundred"] : n < 1e6 ? [1000, "thousand"] : [1e6, "million"];
    const rest = n % size;
    const head = `${numberToWords(Math.floor(n / size), withAnd)} ${name}`;
    if (!rest) return head;
    return `${head} ${withAnd && rest < 100 ? "and " : ""}${numberToWords(rest, withAnd)}`;
}

const ORDINAL_ENDINGS: Record<string, string> = {
    one: "first", two: "second", three: "third", five: "fifth",
    eight: "eighth", nine: "ninth", twelve: "twelfth",
};

/** 21 → "twenty first". */
function ordinalWords(n: number): string {
    const words = numberToWords(n).split(" ");
    const last = words.pop()!;
    const ordinal = ORDINAL_ENDINGS[last] ?? (last.endsWith("y") ? `${last.slice(0, -1)}ieth` : `${last}th`);
    return [...words, ordinal].join(" ");
}

/** A year read in pairs: 1998 → "nineteen ninety eight", 1905 → "nineteen oh five". */
function yearWords(n: number): string | null {
    if (n < 1100 || n > 2099 || (n >= 2000 && n < 2010)) return null;
    const hi = numberToWords(Math.floor(n / 100));
    const lo = n % 100;
    if (lo === 0) return `${hi} hundred`;
    return lo < 10 ? `${hi} oh ${ONES[lo]}` : `${hi} ${numberToWords(lo)}`;
}

const MONTHS = new Set([
    "january", "february", "march", "april", "may", "june", "july",
    "august", "september", "october", "november", "december",
]);

/** Every way a learner might say a run of digits. */
function numberReadings(digits: string, afterMonth: boolean): string[] {
    const plain = digits.replace(/,/g, "");
    // "0901": a phone number or a code, read digit by digit.
    if ((plain.length > 1 && plain.startsWith("0")) || plain.length > 9) {
        return [[...plain].map((d) => ONES[Number(d)]).join(" ")];
    }
    const n = Number(plain);
    const out = [numberToWords(n), numberToWords(n, true)];
    if (n >= 100 && n < 200) out.push(...out.map((r) => r.replace(/^one hundred/, "a hundred")));
    if (n >= 1000 && n < 2000) out.push(...out.map((r) => r.replace(/^one thousand/, "a thousand")));
    if (!digits.includes(",")) {
        const year = yearWords(n);
        if (year) out.push(year);
        // A group of a phone number ("234" in "0901 234 567").
        if (plain.length >= 3) out.push([...plain].map((d) => ONES[Number(d)]).join(" "));
    }
    // "May 5" is said "May fifth".
    if (afterMonth && n >= 1 && n <= 31) out.push(ordinalWords(n));
    return [...new Set(out)];
}

const CURRENCIES: Record<string, [string, string]> = {
    $: ["dollar", "dollars"],
    "£": ["pound", "pounds"],
    "€": ["euro", "euros"],
};

/**
 * A number with whatever is written around it: "$5.50", "7:30", "2.5", "21st",
 * "10%". `afterMonth` and `beforeMeridiem` are about the neighbouring words.
 */
function numericReadings(
    match: RegExpExecArray,
    afterMonth: boolean,
    beforeMeridiem: boolean,
): string[] {
    const [, currency, digits, separator, fraction, suffix] = match;
    const n = Number(digits.replace(/,/g, ""));
    if (currency) {
        const [one, many] = CURRENCIES[currency];
        const amount = `${numberToWords(n)} ${n === 1 ? one : many}`;
        if (separator !== "." || !fraction) return [amount];
        const cents = numberToWords(Number(fraction));
        return [`${amount} ${cents}`, `${amount} and ${cents} cents`, `${amount} ${cents} cents`, `${numberToWords(n)} ${cents}`];
    }
    if (separator === ":" && fraction) {
        const hour = numberToWords(n);
        const minutes = Number(fraction);
        if (minutes === 0) return beforeMeridiem ? [hour] : [`${hour} o'clock`, hour];
        return [minutes < 10 ? `${hour} oh ${ONES[minutes]}` : `${hour} ${numberToWords(minutes)}`];
    }
    if (separator === "." && fraction) {
        const decimals = [...fraction].map((d) => ONES[Number(d)]).join(" ");
        const out = [`${numberToWords(n)} point ${decimals}`];
        if (n === 0) out.push(`point ${decimals}`);
        return out;
    }
    if (suffix === "%") return numberReadings(digits, false).map((r) => `${r} percent`);
    if (suffix) return [ordinalWords(n)];
    return numberReadings(digits, afterMonth);
}

const NUMERIC = /([$£€])?(\d+(?:,\d{3})*)(?:([.:])(\d+))?(st|nd|rd|th|%)?/g;
const MERIDIEM = /^[ap]\.?m\.?$/;

/** Lower case, straight apostrophes, no diacritics ("Nguyễn" → "nguyen"). */
function fold(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[đĐ]/g, "d")
        .toLowerCase()
        .replace(/[’‘`]/g, "'");
}

/** Contractions expanded, apostrophes, hyphens and punctuation gone. */
function toTokens(text: string): string[] {
    let s = text;
    for (const [pattern, replacement] of CONTRACTIONS) s = s.replace(pattern, replacement);
    // "o'clock" and anything else still holding an apostrophe become one word.
    s = s.replace(/'/g, "");
    // Hyphens join words ("T-shirt", "twenty-one"); recognisers drop them.
    s = s.replace(/-/g, " ").replace(/&/g, " and ");
    return s.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

/**
 * The ways one written word can be said, as token lists, best guess first.
 * The neighbours matter for "May 5" (fifth) and "7:00 pm" (no "o'clock").
 */
function wordReadings(word: string, previous?: string, next?: string): string[][] {
    // "3pm" / "3 p.m." / "a.m." all become "3 pm" / "am".
    const s = fold(word)
        .replace(/(\d)([ap])\.?m\b\.?/g, "$1 $2m")
        .replace(/\b([ap])\.m\b\.?/g, "$1m");
    const afterMonth = previous !== undefined && MONTHS.has(toTokens(fold(previous)).join(" "));
    const beforeMeridiem =
        /\d\s*[ap]m\b/.test(s) || (next !== undefined && MERIDIEM.test(fold(next).replace(/[^a-z.]/g, "")));

    let texts = [""];
    let at = 0;
    for (const match of s.matchAll(NUMERIC)) {
        const before = s.slice(at, match.index);
        const options = numericReadings(match as RegExpExecArray, afterMonth, beforeMeridiem);
        texts = texts.flatMap((t) => options.map((o) => `${t}${before} ${o} `));
        at = match.index! + match[0].length;
    }
    texts = texts.map((t) => t + s.slice(at));
    return texts.map(toTokens);
}

/** Lower-case words with contractions expanded, digits spelled out and punctuation gone. */
export function normalizeSpeech(text: string): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    return words.flatMap((w, i) => wordReadings(w, words[i - 1], words[i + 1])[0]);
}

// ---------------------------------------------------------------------------
// Vietnamese names

/** Letters only Vietnamese uses (plus the precomposed Vietnamese block). */
const VIETNAMESE_LETTERS = /[ăâđêôơưĂÂĐÊÔƠƯẠ-ỹ]/;

/** Common Vietnamese family, middle and given names, without diacritics. */
const VIETNAMESE_NAMES = new Set([
    "nguyen", "tran", "le", "pham", "hoang", "huynh", "phan", "vu", "vo", "dang", "bui", "do",
    "ho", "ngo", "duong", "ly", "luu", "trinh", "dinh", "doan", "truong", "vuong", "mai", "ta",
    "van", "thi", "an", "anh", "bao", "binh", "cam", "chau", "chi", "cuong", "dat", "diep", "dieu",
    "duc", "dung", "giang", "ha", "hai", "hang", "hanh", "hao", "hau", "hien", "hieu", "hoa",
    "hoai", "hong", "hue", "hung", "huong", "huy", "khanh", "khoa", "khoi", "kien", "kiet", "kim",
    "lam", "lan", "lien", "linh", "loc", "long", "minh", "my", "nam", "nga", "ngan", "nghia",
    "ngoc", "nhan", "nhat", "nhi", "nhung", "oanh", "phat", "phong", "phuc", "phuong", "quan",
    "quang", "quoc", "quyen", "quynh", "sang", "son", "tai", "tam", "tan", "thang", "thanh",
    "thao", "thinh", "thu", "thuy", "tien", "toan", "trang", "tri", "trung", "tu", "tuan",
    "tung", "tuyet", "uyen", "viet", "vinh", "vy", "xuan", "yen",
]);

/** Names above that are also everyday English words ("Do you…", "Long time…"). */
const ALSO_ENGLISH = new Set([
    "an", "do", "ho", "ha", "le", "van", "long", "son", "hung", "hang", "kim", "chi", "cam",
    "my", "ta", "tan", "sang", "yen", "dung", "tam", "lam", "tu", "nam", "mai", "hue", "tai",
]);

const TITLES = new Set(["mr", "mrs", "ms", "miss", "dr"]);

function bare(word: string): string {
    return word.replace(/^[^0-9A-Za-zÀ-ɏḀ-ỿ]+|[^0-9A-Za-zÀ-ɏḀ-ỿ]+$/g, "");
}

function isCapitalized(word: string): boolean {
    return word.length > 0 && word[0] !== word[0].toLowerCase();
}

/**
 * Which written words are (probably) Vietnamese names or places: anything
 * written with Vietnamese letters, and capitalised runs of common Vietnamese
 * names. A lone name that is also an English word counts only mid-sentence,
 * so "Do you…" stays a question while "Ask Long" is a name.
 */
function vietnameseNameFlags(written: string[]): boolean[] {
    const flags = written.map((w) => VIETNAMESE_LETTERS.test(w));
    const sentenceStart = (i: number) => {
        if (i === 0) return true;
        const previous = written[i - 1];
        return /[.!?]["')\]]*$/.test(previous) && !TITLES.has(fold(bare(previous)));
    };
    const inRun = (i: number) => {
        const b = bare(written[i]);
        return isCapitalized(b) && !/^I($|')/.test(b) && !TITLES.has(fold(b));
    };
    const known = (i: number) => VIETNAMESE_NAMES.has(fold(bare(written[i])));
    let i = 0;
    while (i < written.length) {
        // A sentence's first word is capitalised anyway ("Ask Long"): it starts
        // a name only if it looks like one.
        if (!inRun(i) || (sentenceStart(i) && !flags[i] && !known(i))) {
            i++;
            continue;
        }
        let end = i;
        while (end + 1 < written.length && inRun(end + 1) && !sentenceStart(end + 1)) end++;
        const members = Array.from({ length: end - i + 1 }, (_, k) => i + k);
        const names = members.filter(known);
        if (members.some((k) => flags[k]) || names.length >= 2) {
            for (const k of members) flags[k] = true;
        } else {
            for (const k of names) {
                if (!ALSO_ENGLISH.has(fold(bare(written[k]))) || !sentenceStart(k)) flags[k] = true;
            }
        }
        i = end + 1;
    }
    return flags;
}

// ---------------------------------------------------------------------------
// Alignment

interface Reading {
    tokens: string[];
    /** For each token, the written word it came from. */
    source: number[];
    /** For each token, whether it belongs to a Vietnamese name. */
    name: boolean[];
}

/** Readings of a whole text are the combinations of its words' readings; capped. */
const MAX_READINGS = 16;

function readings(text: string, withNames: boolean): { written: string[]; all: Reading[] } {
    const written = text.split(/\s+/).filter(Boolean);
    const names = withNames ? vietnameseNameFlags(written) : written.map(() => false);
    let all: Reading[] = [{ tokens: [], source: [], name: [] }];
    written.forEach((word, w) => {
        const options = wordReadings(word, written[w - 1], written[w + 1]);
        const next: Reading[] = [];
        // The first option for every reading so far, then the others while there's room.
        for (const option of options) {
            for (const r of all) {
                if (next.length >= MAX_READINGS) break;
                next.push({
                    tokens: [...r.tokens, ...option],
                    source: [...r.source, ...option.map(() => w)],
                    name: [...r.name, ...option.map(() => names[w])],
                });
            }
        }
        all = next;
    });
    return { written, all };
}

/**
 * Cost of a name the recogniser dropped altogether: it may just not have caught
 * it. The rest of a longer name costs nothing ("Hà Nội" heard as "hanoi").
 */
const MISSED_NAME_COST = 0.5;

/**
 * Word-level alignment of `heard` against `expected`: the edit distance and,
 * for each expected token, whether it was heard in place. A name token matches
 * any one or two heard words.
 */
function align(expected: Reading, heard: string[]): { distance: number; matched: boolean[] } {
    const want = expected.tokens;
    const isName = expected.name;
    const rows = want.length + 1;
    const cols = heard.length + 1;
    const skip = (i: number) => {
        if (!isName[i - 1]) return 1;
        return i >= 2 && isName[i - 2] ? 0 : MISSED_NAME_COST;
    };
    const d: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
    for (let j = 1; j < cols; j++) d[0][j] = j;
    for (let i = 1; i < rows; i++) {
        d[i][0] = d[i - 1][0] + skip(i);
        for (let j = 1; j < cols; j++) {
            const same = isName[i - 1] || sameWord(want[i - 1], heard[j - 1]) ? 0 : 1;
            let best = Math.min(d[i - 1][j] + skip(i), d[i][j - 1] + 1, d[i - 1][j - 1] + same);
            if (isName[i - 1] && j >= 2) best = Math.min(best, d[i - 1][j - 2]);
            d[i][j] = best;
        }
    }

    const matched = new Array<boolean>(want.length).fill(false);
    let i = want.length;
    let j = heard.length;
    while (i > 0) {
        const name = isName[i - 1];
        if (j > 0 && (name || sameWord(want[i - 1], heard[j - 1])) && d[i][j] === d[i - 1][j - 1]) {
            matched[i - 1] = true;
            i--;
            j--;
        } else if (name && j >= 2 && d[i][j] === d[i - 1][j - 2]) {
            matched[i - 1] = true;
            i--;
            j -= 2;
        } else if (j > 0 && d[i][j] === d[i - 1][j - 1] + 1) {
            i--;
            j--;
        } else if (d[i][j] === d[i - 1][j] + skip(i)) {
            matched[i - 1] = skip(i) === 0;
            i--;
        } else {
            j--;
        }
    }
    return { distance: d[rows - 1][cols - 1], matched };
}

/**
 * Maps the matched tokens back onto the written sentence, so the result can be
 * shown with its own spelling ("I'm" stays one word even though it was scored
 * as "i am": it counts as matched only if both parts were).
 */
function toWrittenWords(written: string[], reading: Reading, matched: boolean[]): SpokenWord[] {
    return written.map((word, w) => ({
        word,
        matched: reading.source.every((s, k) => s !== w || matched[k]),
    }));
}

function scoreOne(expected: string, transcript: string): SpeechScore {
    const want = readings(expected, true);
    const got = readings(transcript, false).all.map((r) => r.tokens);
    let best: { accuracy: number; reading: Reading; matched: boolean[] } | null = null;
    for (const reading of want.all) {
        for (const heard of got) {
            const { distance, matched } = align(reading, heard);
            const total = reading.tokens.length;
            const accuracy = total === 0 ? 0 : Math.max(0, 1 - distance / total);
            if (!best || accuracy > best.accuracy) best = { accuracy, reading, matched };
        }
    }
    const { accuracy, reading, matched } = best!;
    return {
        accuracy,
        quality: accuracyToQuality(accuracy),
        words: toWrittenWords(want.written, reading, matched),
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
