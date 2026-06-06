/**
 * Remembers the last course opened in Manage — used for "Continue editing".
 */
export const LAST_MANAGE_COURSE_KEY = "wordsly.lastManageCourse";

export type LastManageCourse = {
    id: string;
    name: string;
};

export function getLastManageCourse(): LastManageCourse | null {
    if (globalThis.window === undefined) return null;
    try {
        const raw = globalThis.localStorage.getItem(LAST_MANAGE_COURSE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (
            parsed &&
            typeof parsed === "object" &&
            "id" in parsed &&
            "name" in parsed &&
            typeof (parsed as LastManageCourse).id === "string" &&
            typeof (parsed as LastManageCourse).name === "string"
        ) {
            return { id: (parsed as LastManageCourse).id, name: (parsed as LastManageCourse).name };
        }
        return null;
    } catch {
        return null;
    }
}

export function setLastManageCourse(course: LastManageCourse): void {
    if (globalThis.window === undefined) return;
    try {
        globalThis.localStorage.setItem(LAST_MANAGE_COURSE_KEY, JSON.stringify(course));
    } catch {
        // ignore
    }
}
