import type { AdminRecordBody } from "@/types/admin-path/admin-path.type";

/**
 * Reading JSON an admin pastes or picks as a file, before it goes into a form
 * (one record) or to the unit import (a whole unit file). Nothing here saves.
 */

export type ParsedJson = { ok: true; record: AdminRecordBody } | { ok: false; error: string };

export function parseJsonObject(text: string): ParsedJson {
    let value: unknown;
    try {
        value = JSON.parse(text);
    } catch (error) {
        return { ok: false, error: `Not valid JSON: ${error instanceof Error ? error.message : String(error)}` };
    }
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return { ok: false, error: "Expected one JSON object, like { \"slug\": … }." };
    }
    return { ok: true, record: value as AdminRecordBody };
}

/**
 * One record for an editor. Editing an existing record, the JSON must keep its
 * slug: the slug is the content id, so another slug is another record.
 */
export function parseRecordJson(text: string, slug: string | null): ParsedJson {
    const parsed = parseJsonObject(text);
    if (!parsed.ok) return parsed;
    const own = parsed.record.slug;
    if (slug && own !== slug) {
        return {
            ok: false,
            error: `This JSON is for "${typeof own === "string" ? own : "(no slug)"}", not ${slug}. The slug can't change; create a new record for it instead.`,
        };
    }
    return parsed;
}

/** A unit file (`content/units/<stage>/<unit>.json`): the server checks the rest. */
export function parseUnitFileJson(text: string): ParsedJson {
    const parsed = parseJsonObject(text);
    if (!parsed.ok) return parsed;
    const r = parsed.record;
    if (typeof r.slug !== "string" || typeof r.stage !== "string" || !Array.isArray(r.lessons)) {
        return { ok: false, error: "This isn't a unit file: it needs slug, stage and lessons, like the files in content/units/." };
    }
    return parsed;
}
