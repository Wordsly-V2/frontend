import { getLangeekWordDetails, LangeekExample, searchWords } from "@/apis/dictionary.api";
import { CreateMyWord, IWordExample } from "@/types/courses/courses.type";
import { normalizeAnswer, serializeExamples } from "@/lib/practice-utils";

/** One dictionary sense of a word — a word can have several across parts of speech. */
export interface WordSense {
    partOfSpeech: string;
    meaning: string;
    imageUrl: string;
    langeekWordId: number;
}

/**
 * A single word being staged for bulk import — examples kept as structured
 * objects (`text` + optional `translation` / `audioUrl`) until submit, matching
 * the add/edit word form.
 */
export interface ImportWordRow {
    id: string;
    word: string;
    meaning: string;
    pronunciation: string;
    partOfSpeech: string;
    audioUrl: string;
    imageUrl: string;
    examples: IWordExample[];
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

let exampleIdCounter = 0;
export function nextExampleId(): string {
    exampleIdCounter += 1;
    return `import-ex-${exampleIdCounter}`;
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

function optionalField(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/**
 * Normalize one example entry, which may be a plain string (legacy) or an
 * object `{ text, translation?, audioUrl? }` (current persisted/dictionary
 * shape). Returns null when there is no sentence text.
 */
function toExample(entry: unknown): IWordExample | null {
    if (typeof entry === "string") {
        const text = entry.trim();
        return text ? { id: nextExampleId(), text } : null;
    }
    if (entry && typeof entry === "object") {
        const e = entry as Record<string, unknown>;
        const text = typeof e.text === "string" ? e.text.trim() : "";
        if (!text) return null;
        const translation = optionalField(e.translation ?? e.meaning);
        const audioUrl = optionalField(e.audioUrl ?? e.audio);
        return {
            id: nextExampleId(),
            text,
            ...(translation ? { translation } : {}),
            ...(audioUrl ? { audioUrl } : {}),
        };
    }
    return null;
}

/** Parse the `example` field from any source into structured examples. */
export function parseExamplesValue(value: unknown): IWordExample[] {
    if (Array.isArray(value)) {
        return value.map(toExample).filter((e): e is IWordExample => e !== null);
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed.map(toExample).filter((e): e is IWordExample => e !== null);
            }
            if (parsed && typeof parsed === "object") {
                const single = toExample(parsed);
                return single ? [single] : [];
            }
        } catch {
            // not JSON — treat as a single example sentence
        }
        return [{ id: nextExampleId(), text: trimmed }];
    }
    return [];
}

const exampleKey = (example: IWordExample) => example.text.trim().toLowerCase();

/**
 * Merge incoming examples into existing ones, deduping by sentence text. A
 * duplicate never replaces what is already there — it only backfills a missing
 * translation or audio URL.
 */
export function mergeExamples(
    existing: IWordExample[],
    incoming: IWordExample[],
): IWordExample[] {
    const byKey = new Map<string, IWordExample>();
    const merged: IWordExample[] = [];
    for (const example of existing) {
        const key = exampleKey(example);
        if (!key || byKey.has(key)) continue;
        byKey.set(key, example);
        merged.push(example);
    }
    for (const example of incoming) {
        const key = exampleKey(example);
        if (!key) continue;
        const current = byKey.get(key);
        if (!current) {
            byKey.set(key, example);
            merged.push(example);
            continue;
        }
        const filled: IWordExample = {
            ...current,
            ...(!current.translation?.trim() && example.translation
                ? { translation: example.translation }
                : {}),
            ...(!current.audioUrl?.trim() && example.audioUrl
                ? { audioUrl: example.audioUrl }
                : {}),
        };
        byKey.set(key, filled);
        merged[merged.indexOf(current)] = filled;
    }
    return merged;
}

/** Convert dictionary examples into staged example rows. */
function fromDictionaryExamples(examples: LangeekExample[] | undefined): IWordExample[] {
    return (examples ?? [])
        .map((e) =>
            toExample({ text: e.text, translation: e.translation, audioUrl: e.audioUrl }),
        )
        .filter((e): e is IWordExample => e !== null);
}

/**
 * Columns a source file can map to. Beyond the row's own fields there are two
 * virtual columns that decorate the example sentence in the same line.
 */
type ImportField = keyof ImportWordRow | "exampleTranslation" | "exampleAudioUrl";

const HEADER_ALIASES: Record<string, ImportField> = {
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
    exampletranslation: "exampleTranslation",
    examplemeaning: "exampleTranslation",
    exampleaudio: "exampleAudioUrl",
    exampleaudiourl: "exampleAudioUrl",
};

/** Positional columns used when there is no recognizable header row. */
const POSITIONAL_FIELDS: ImportField[] = [
    "word",
    "meaning",
    "pronunciation",
    "partOfSpeech",
];

function assignCell(row: ImportWordRow, field: ImportField, raw: string) {
    const value = raw.trim();
    if (!value) return;
    if (field === "examples") {
        row.examples = mergeExamples(row.examples, parseExamplesValue(value));
    } else if (field === "exampleTranslation" || field === "exampleAudioUrl") {
        // Decorates the example already parsed from this same line.
        const last = row.examples.at(-1);
        if (!last) return;
        const key = field === "exampleTranslation" ? "translation" : "audioUrl";
        if (!last[key]?.trim()) last[key] = value;
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
function detectHeader(cells: string[]): ImportField[] | null {
    const mapped = cells.map((c) => HEADER_ALIASES[c.trim().toLowerCase().replaceAll(/[\s_-]/g, "")]);
    // A header row must name "word" and resolve most of its columns.
    if (!mapped.includes("word")) return null;
    const known = mapped.filter(Boolean).length;
    if (known < Math.ceil(cells.length / 2)) return null;
    return mapped as ImportField[];
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

    let header: ImportField[] | null = null;
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
        // Example text must land before the columns that decorate it, whatever
        // order the file puts them in.
        const decorators: ImportField[] = ["exampleTranslation", "exampleAudioUrl"];
        cells
            .map((cell, idx) => [fields[idx], cell] as const)
            .filter(([field]) => field)
            .sort(([a], [b]) => Number(decorators.includes(a!)) - Number(decorators.includes(b!)))
            .forEach(([field, cell]) => assignCell(row, field!, cell));
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
        // Keeps each example's translation and audio URL alongside its text.
        example: serializeExamples(row.examples),
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
            next.examples = mergeExamples([], fromDictionaryExamples(details.examples));
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
                    const fetched = fromDictionaryExamples(details.examples);
                    // Either way the dictionary only backfills a translation or
                    // audio URL the row is missing — typed values stay put.
                    next.examples = overwrite
                        ? mergeExamples(fetched, next.examples)
                        : mergeExamples(next.examples, fetched);
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
