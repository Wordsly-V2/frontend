import { getLangeekWordDetails, searchWords } from "@/apis/dictionary.api";
import { CreateMyWord } from "@/types/courses/courses.type";
import { normalizeAnswer, serializeExamples } from "@/lib/practice-utils";

/** One dictionary sense of a word — a word can have several across parts of speech. */
export interface WordSense {
    partOfSpeech: string;
    meaning: string;
    imageUrl: string;
    langeekWordId: number;
}

/** A single word being staged for bulk import — examples kept as an array until submit. */
export interface ImportWordRow {
    id: string;
    word: string;
    meaning: string;
    pronunciation: string;
    partOfSpeech: string;
    audioUrl: string;
    imageUrl: string;
    examples: string[];
    /** Set after a dictionary auto-enrich pass. */
    enriched?: boolean;
    /** Alternative dictionary senses (different parts of speech), found during enrich. */
    senses?: WordSense[];
}

let rowIdCounter = 0;
function nextRowId(): string {
    rowIdCounter += 1;
    return `import-${rowIdCounter}`;
}

function emptyRow(): ImportWordRow {
    return {
        id: nextRowId(),
        word: "",
        meaning: "",
        pronunciation: "",
        partOfSpeech: "",
        audioUrl: "",
        imageUrl: "",
        examples: [],
    };
}

/**
 * Extract the sentence text from an example entry, which may be a plain string
 * (legacy) or an object `{ text, … }` (current persisted/dictionary shape).
 */
function exampleText(entry: unknown): string | null {
    if (typeof entry === "string") return entry.trim() || null;
    if (entry && typeof entry === "object" && typeof (entry as { text?: unknown }).text === "string") {
        return ((entry as { text: string }).text).trim() || null;
    }
    return null;
}

/** Parse the `example` field from any source into a clean string array. */
export function parseExamplesValue(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map(exampleText).filter((e): e is string => e !== null);
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed.map(exampleText).filter((e): e is string => e !== null);
            }
        } catch {
            // not JSON — treat as a single example sentence
        }
        return [trimmed];
    }
    return [];
}

const HEADER_ALIASES: Record<string, keyof ImportWordRow> = {
    word: "word",
    term: "word",
    meaning: "meaning",
    definition: "meaning",
    translation: "meaning",
    pronunciation: "pronunciation",
    ipa: "pronunciation",
    phonetic: "pronunciation",
    partofspeech: "partOfSpeech",
    pos: "partOfSpeech",
    type: "partOfSpeech",
    audiourl: "audioUrl",
    audio: "audioUrl",
    imageurl: "imageUrl",
    image: "imageUrl",
    example: "examples",
    examples: "examples",
};

/** Positional columns used when there is no recognizable header row. */
const POSITIONAL_FIELDS: (keyof ImportWordRow)[] = [
    "word",
    "meaning",
    "pronunciation",
    "partOfSpeech",
];

function assignCell(row: ImportWordRow, field: keyof ImportWordRow, raw: string) {
    const value = raw.trim();
    if (!value) return;
    if (field === "examples") {
        row.examples = [...new Set([...row.examples, ...parseExamplesValue(value)])];
    } else if (
        field === "word" ||
        field === "meaning" ||
        field === "pronunciation" ||
        field === "partOfSpeech" ||
        field === "audioUrl" ||
        field === "imageUrl"
    ) {
        row[field] = value;
    }
}

/** Split one CSV line respecting double-quoted fields ("a, b" -> single cell). */
function splitCsvLine(line: string): string[] {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (inQuotes) {
            if (char === '"') {
                if (line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else if (char === '"') {
            inQuotes = true;
        } else if (char === ",") {
            cells.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    cells.push(current);
    return cells;
}

/** Detect a header row and return the field mapping, or null for positional parsing. */
function detectHeader(cells: string[]): (keyof ImportWordRow)[] | null {
    const mapped = cells.map((c) => HEADER_ALIASES[c.trim().toLowerCase().replaceAll(/[\s_-]/g, "")]);
    // A header row must name "word" and resolve most of its columns.
    if (!mapped.includes("word")) return null;
    const known = mapped.filter(Boolean).length;
    if (known < Math.ceil(cells.length / 2)) return null;
    return mapped as (keyof ImportWordRow)[];
}

/**
 * Parse pasted text or CSV into import rows.
 * - Comma-separated (CSV, with optional header) or tab-separated columns.
 * - One word per line; column order: word, meaning, pronunciation, part of speech.
 */
export function parseWordsDelimited(text: string): ImportWordRow[] {
    const lines = text.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];

    const useTabs = lines[0].includes("\t") && !lines[0].includes(",");
    const split = (line: string) => (useTabs ? line.split("\t") : splitCsvLine(line));

    let header: (keyof ImportWordRow)[] | null = null;
    let startIndex = 0;
    const firstCells = split(lines[0]);
    if (firstCells.length > 1) {
        header = detectHeader(firstCells);
        if (header) startIndex = 1;
    }

    const rows: ImportWordRow[] = [];
    for (let i = startIndex; i < lines.length; i++) {
        const cells = split(lines[i]);
        const row = emptyRow();
        const fields = header ?? POSITIONAL_FIELDS;
        cells.forEach((cell, idx) => {
            const field = fields[idx];
            if (field) assignCell(row, field, cell);
        });
        if (row.word) rows.push(row);
    }
    return rows;
}

/** Parse a JSON array of word objects (matches the export format and seed data). */
export function parseWordsJson(text: string): ImportWordRow[] {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
        throw new Error("JSON must be an array of word objects");
    }
    return parsed
        .filter((item) => item && typeof item === "object")
        .map((item: Record<string, unknown>) => {
            const row = emptyRow();
            assignCell(row, "word", String(item.word ?? ""));
            assignCell(row, "meaning", String(item.meaning ?? ""));
            assignCell(row, "pronunciation", String(item.pronunciation ?? ""));
            assignCell(row, "partOfSpeech", String(item.partOfSpeech ?? ""));
            assignCell(row, "audioUrl", String(item.audioUrl ?? ""));
            assignCell(row, "imageUrl", String(item.imageUrl ?? ""));
            row.examples = parseExamplesValue(item.example ?? item.examples);
            return row;
        })
        .filter((row) => row.word);
}

/** Serialize a staged row into the bulk-create payload shape. */
export function rowToCreateMyWord(row: ImportWordRow): CreateMyWord {
    return {
        word: row.word.trim(),
        meaning: row.meaning.trim(),
        pronunciation: row.pronunciation.trim(),
        partOfSpeech: row.partOfSpeech.trim(),
        audioUrl: row.audioUrl.trim(),
        imageUrl: row.imageUrl.trim(),
        // Bulk import is text-only; wrap each sentence in the structured shape.
        example: serializeExamples(row.examples.map((text) => ({ id: "", text }))),
    };
}

export function isRowValid(row: ImportWordRow): boolean {
    return row.word.trim().length > 0 && row.meaning.trim().length > 0;
}

/** Drop duplicate senses (same part of speech + meaning). */
function dedupeSenses(senses: WordSense[]): WordSense[] {
    const seen = new Set<string>();
    const out: WordSense[] = [];
    for (const sense of senses) {
        const key = `${sense.partOfSpeech.toLowerCase()}::${sense.meaning.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(sense);
    }
    return out;
}

/** Whether a row currently reflects the given sense (part of speech + meaning). */
export function isSenseActive(row: ImportWordRow, sense: WordSense): boolean {
    return (
        normalizeAnswer(row.partOfSpeech) === normalizeAnswer(sense.partOfSpeech) &&
        normalizeAnswer(row.meaning) === normalizeAnswer(sense.meaning)
    );
}

/**
 * Switch a row to a chosen sense: overwrites meaning/part of speech/image with
 * that sense, then re-fetches pronunciation/audio/examples for its part of speech.
 */
export async function applySenseToRow(
    row: ImportWordRow,
    sense: WordSense,
): Promise<ImportWordRow> {
    const next: ImportWordRow = {
        ...row,
        meaning: sense.meaning || row.meaning,
        partOfSpeech: sense.partOfSpeech,
        imageUrl: sense.imageUrl || row.imageUrl,
        enriched: true,
    };
    try {
        const details = await getLangeekWordDetails(row.word.trim(), sense.partOfSpeech);
        if (details) {
            next.pronunciation = details.pronunciation || "";
            next.audioUrl = details.audioUrl || "";
            if (details.imageUrl) next.imageUrl = details.imageUrl;
            next.examples = details.examples?.length
                ? [...new Set(details.examples.map((e) => e.text))]
                : [];
        }
    } catch {
        // keep the sense's basic fields even if the details fetch fails
    }
    return next;
}

export interface EnrichOptions {
    /**
     * Replace dictionary-derived fields with fresh values instead of only
     * filling blanks. Use when re-enriching a single word the user just edited.
     */
    overwrite?: boolean;
}

/**
 * Pull dictionary data into a row. By default only fills missing fields (safe for
 * bulk enrich); with `overwrite`, refreshes all dictionary-derived fields for the
 * current word (used by the per-row re-enrich after editing). Returns a new row.
 */
export async function enrichWordRow(
    row: ImportWordRow,
    { overwrite = false }: EnrichOptions = {},
): Promise<ImportWordRow> {
    const query = row.word.trim();
    if (!query) return row;

    let results;
    try {
        results = await searchWords(query);
    } catch {
        return { ...row, enriched: true };
    }
    const exactMatches = results.filter(
        (r) => normalizeAnswer(r.word) === normalizeAnswer(query),
    );
    const relevant = exactMatches.length > 0 ? exactMatches : results;
    const match = relevant[0];
    if (!match) return { ...row, enriched: true, senses: [] };

    // Collect distinct senses (a word can have noun/verb/adj… meanings).
    const senses = dedupeSenses(
        relevant
            .filter((r) => r.partOfSpeech?.trim())
            .map((r) => ({
                partOfSpeech: r.partOfSpeech.trim(),
                meaning: r.meaning ?? "",
                imageUrl: r.imageUrl ?? "",
                langeekWordId: r.langeekWordId,
            })),
    );

    const next: ImportWordRow = { ...row, enriched: true, senses };
    const shouldSet = (current: string) => overwrite || !current;
    if (shouldSet(next.meaning) && match.meaning) next.meaning = match.meaning;
    if (shouldSet(next.partOfSpeech) && match.partOfSpeech) next.partOfSpeech = match.partOfSpeech;
    if (shouldSet(next.imageUrl) && match.imageUrl) next.imageUrl = match.imageUrl;

    const pos = match.partOfSpeech?.trim();
    if (match.langeekWordId != null && pos) {
        try {
            const details = await getLangeekWordDetails(match.word, pos);
            if (details) {
                if (shouldSet(next.pronunciation) && details.pronunciation) next.pronunciation = details.pronunciation;
                if (shouldSet(next.audioUrl) && details.audioUrl) next.audioUrl = details.audioUrl;
                if (shouldSet(next.imageUrl) && details.imageUrl) next.imageUrl = details.imageUrl;
                if (details.examples?.length) {
                    const texts = details.examples.map((e) => e.text);
                    next.examples = overwrite
                        ? [...new Set(texts)]
                        : [...new Set([...next.examples, ...texts])];
                }
            }
        } catch {
            // keep partial enrichment
        }
    }
    return next;
}

/** Run an async mapper over items with bounded concurrency, reporting progress. */
export async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    mapper: (item: T, index: number) => Promise<R>,
    onProgress?: (done: number) => void,
): Promise<R[]> {
    const results = new Array<R>(items.length);
    let cursor = 0;
    let done = 0;

    async function worker() {
        while (cursor < items.length) {
            const index = cursor;
            cursor += 1;
            results[index] = await mapper(items[index], index);
            done += 1;
            onProgress?.(done);
        }
    }

    const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
    await Promise.all(workers);
    return results;
}
