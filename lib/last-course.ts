/**
 * Generic "last opened course" store backed by localStorage. Learn and Manage
 * each remember the last course the learner opened; both are the same shape and
 * validation, differing only by storage key — so they share this factory.
 */
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/local-storage";

export type LastCourse = {
    id: string;
    name: string;
};

function isLastCourse(value: unknown): value is LastCourse {
    return (
        !!value &&
        typeof value === "object" &&
        "id" in value &&
        "name" in value &&
        typeof (value as LastCourse).id === "string" &&
        typeof (value as LastCourse).name === "string"
    );
}

export interface LastCourseStore {
    get(): LastCourse | null;
    set(course: LastCourse): void;
}

export function createLastCourseStore(storageKey: string): LastCourseStore {
    return {
        get() {
            const raw = getLocalStorageItem(storageKey);
            if (!raw) return null;
            try {
                const parsed: unknown = JSON.parse(raw);
                return isLastCourse(parsed) ? { id: parsed.id, name: parsed.name } : null;
            } catch {
                return null;
            }
        },
        set(course) {
            setLocalStorageItem(storageKey, JSON.stringify({ id: course.id, name: course.name }));
        },
    };
}
