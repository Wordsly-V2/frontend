import { describe, expect, it } from "vitest";
import { parseJsonObject, parseRecordJson, parseUnitFileJson } from "@/lib/admin-path/json-import";

describe("json import", () => {
    it("reads one object and refuses anything else", () => {
        expect(parseJsonObject('{"slug":"a"}')).toEqual({ ok: true, record: { slug: "a" } });
        expect(parseJsonObject("{ nope").ok).toBe(false);
        expect(parseJsonObject("[1]")).toMatchObject({ ok: false, error: expect.stringContaining("one JSON object") });
    });

    it("keeps an existing record's slug", () => {
        expect(parseRecordJson('{"slug":"a"}', "a").ok).toBe(true);
        expect(parseRecordJson('{"slug":"b"}', "a")).toMatchObject({ ok: false, error: expect.stringContaining('"b"') });
        expect(parseRecordJson('{"slug":"b"}', null).ok).toBe(true);
    });

    it("recognises a unit file", () => {
        expect(parseUnitFileJson('{"slug":"u","stage":"a1","lessons":[]}').ok).toBe(true);
        expect(parseUnitFileJson('{"slug":"u","stage":"a1"}').ok).toBe(false);
    });
});
