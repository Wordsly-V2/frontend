import type { AdminRecordBody } from "@/types/admin-path/admin-path.type";
import type { PathDialogue, PathItem, PathItemRole, PathLesson, PathQuestion, PathStep } from "@/types/path/path.type";

/**
 * A lesson record in seed shape (what the editor saves) → the `PathLesson` the
 * player takes, the way a release builds it (`stepView` in curriculum-service's
 * release.logic.ts), except that ids are slugs: a preview is never sent to the
 * server, so it needs ids that agree with each other, not content ids.
 * References that don't resolve are listed in `missing`; the player then skips
 * what has nothing to show, as it does for a published lesson.
 */

const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const str = (v: unknown) => (typeof v === "string" ? v : "");

type Rec = Record<string, unknown>;

export interface LessonPreview {
    lesson: PathLesson;
    /** "item foo", "dialogue bar": referenced but not found. */
    missing: string[];
}

/** The item and dialogue slugs a lesson record references, to load before previewing. */
export function lessonPreviewRefs(record: AdminRecordBody): { items: string[]; dialogues: string[] } {
    const items = new Set(list<Rec>(record.items).map((link) => str(link.item)));
    const dialogues = new Set<string>();
    for (const step of list<Rec>(record.steps)) {
        const payload = (step.payload ?? {}) as Rec;
        list<string>(payload.items).forEach((slug) => items.add(slug));
        if (typeof payload.pattern === "string") items.add(payload.pattern);
        if (typeof payload.dialogue === "string") dialogues.add(payload.dialogue);
    }
    items.delete("");
    return { items: [...items], dialogues: [...dialogues] };
}

export function buildLessonPreview(
    record: AdminRecordBody,
    items: ReadonlyMap<string, AdminRecordBody>,
    dialogues: ReadonlyMap<string, AdminRecordBody>,
): LessonPreview {
    const missing = new Set<string>();
    const slug = str(record.slug);

    const item = (itemSlug: string): PathItem | null => {
        const found = items.get(itemSlug);
        if (!found) {
            missing.add(`item ${itemSlug}`);
            return null;
        }
        const { unit: _unit, ...rest } = found;
        return { ...(rest as unknown as Omit<PathItem, "id">), id: itemSlug, slug: itemSlug };
    };

    const lessonItems = list<Rec>(record.items).flatMap((link) => {
        const found = item(str(link.item));
        return found ? [{ ...found, role: (link.role === "RECYCLE" ? "RECYCLE" : "INTRODUCE") as PathItemRole }] : [];
    });

    const steps = list<Rec>(record.steps).flatMap((step, index): PathStep[] => {
        const id = `${slug}#${index}`;
        const payload = { ...((step.payload ?? {}) as Rec) };
        switch (step.type) {
            case "INTRO":
            case "PRACTICE":
            case "EXPLAIN": {
                const { items: refs, ...rest } = payload;
                if (refs !== undefined) list<string>(refs).forEach((s) => item(s));
                const next = refs === undefined ? rest : { ...rest, itemIds: list<string>(refs) };
                return [{ id, type: step.type, payload: next } as PathStep];
            }
            case "PATTERN_DRILL": {
                const { pattern, ...rest } = payload;
                item(str(pattern));
                return [{ id, type: "PATTERN_DRILL", payload: { ...rest, patternId: str(pattern) } } as PathStep];
            }
            case "DIALOGUE": {
                const { dialogue: dialogueSlug, ...rest } = payload;
                const found = dialogues.get(str(dialogueSlug));
                if (!found) {
                    missing.add(`dialogue ${str(dialogueSlug)}`);
                    return [];
                }
                const dialogue: PathDialogue = {
                    id: str(dialogueSlug),
                    slug: str(dialogueSlug),
                    title: str(found.title),
                    situationVi: str(found.situationVi),
                    lines: list(found.lines),
                };
                return [{ id, type: "DIALOGUE", payload: { ...rest, dialogue } } as PathStep];
            }
            case "QUIZ": {
                const questions = list<Rec>(payload.questions).map(({ item: itemSlug, ...rest }) =>
                    typeof itemSlug === "string" ? { ...rest, itemId: itemSlug } : rest,
                );
                return [{ id, type: "QUIZ", payload: { ...payload, questions: questions as PathQuestion[] } } as PathStep];
            }
            case "WARMUP":
            case "SPEAK":
                return [{ id, type: step.type, payload } as PathStep];
            default:
                return [];
        }
    });

    return {
        lesson: {
            snapshotVersion: 0,
            id: `preview:${slug}`,
            slug,
            unitId: str(record.unit),
            order: Number(record.order) || 1,
            title: str(record.title),
            titleVi: str(record.titleVi),
            estimatedMinutes: Number(record.estimatedMinutes) || 0,
            items: lessonItems,
            steps,
        },
        missing: [...missing],
    };
}
