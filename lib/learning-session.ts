/**
 * Remembers the last course the learner opened in Learn — used for "Continue" and quick review.
 */
export const LAST_LEARN_COURSE_KEY = "wordsly.lastLearnCourse";

export type LastLearnCourse = {
    id: string;
    name: string;
};

export function getLastLearnCourse(): LastLearnCourse | null {
    if (globalThis.window === undefined) return null;
    try {
        const raw = globalThis.localStorage.getItem(LAST_LEARN_COURSE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (
            parsed &&
            typeof parsed === "object" &&
            "id" in parsed &&
            "name" in parsed &&
            typeof (parsed as LastLearnCourse).id === "string" &&
            typeof (parsed as LastLearnCourse).name === "string"
        ) {
            return { id: (parsed as LastLearnCourse).id, name: (parsed as LastLearnCourse).name };
        }
        return null;
    } catch {
        return null;
    }
}

export function setLastLearnCourse(course: LastLearnCourse): void {
    if (globalThis.window === undefined) return;
    try {
        globalThis.localStorage.setItem(LAST_LEARN_COURSE_KEY, JSON.stringify(course));
    } catch {
        // ignore
    }
}
