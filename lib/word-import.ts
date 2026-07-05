import { getLangeekWordDetails, searchWords } from "@/apis/dictionary.api";
import { CreateMyWord } from "@/types/courses/courses.type";
import { normalizeAnswer } from "@/lib/practice-utils";

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

/** Parse the `example` field from any source into a clean string array. */
export function parseExamplesValue(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.filter((e): e is string => typeof e === "string" && e.trim().length > 0);
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed.filter((e): e is string => typeof e === "string" && e.trim().length > 0);
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
    } else if (field !== "id" && field !== "enriched") {
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
        example: JSON.stringify(row.examples.map((e) => e.trim()).filter(Boolean)),
    };
}

export function isRowValid(row: ImportWordRow): boolean {
    return row.word.trim().length > 0 && row.meaning.trim().length > 0;
}

/**
 * Fill blank fields of a row from the dictionary. Never overwrites user-provided
 * values — only fills what's missing. Returns a new row.
 */
export async function enrichWordRow(row: ImportWordRow): Promise<ImportWordRow> {
    const query = row.word.trim();
    if (!query) return row;

    let results;
    try {
        results = await searchWords(query);
    } catch {
        return { ...row, enriched: true };
    }
    const match =
        results.find((r) => normalizeAnswer(r.word) === normalizeAnswer(query)) ?? results[0];
    if (!match) return { ...row, enriched: true };

    const next: ImportWordRow = { ...row, enriched: true };
    if (!next.meaning && match.meaning) next.meaning = match.meaning;
    if (!next.partOfSpeech && match.partOfSpeech) next.partOfSpeech = match.partOfSpeech;
    if (!next.imageUrl && match.imageUrl) next.imageUrl = match.imageUrl;

    const pos = match.partOfSpeech?.trim();
    if (match.langeekWordId != null && pos) {
        try {
            const details = await getLangeekWordDetails(match.word, pos);
            if (details) {
                if (!next.pronunciation && details.pronunciation) next.pronunciation = details.pronunciation;
                if (!next.audioUrl && details.audioUrl) next.audioUrl = details.audioUrl;
                if (!next.imageUrl && details.imageUrl) next.imageUrl = details.imageUrl;
                if (details.examples?.length) {
                    next.examples = [...new Set([...next.examples, ...details.examples])];
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
