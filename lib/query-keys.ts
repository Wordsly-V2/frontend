/**
 * Central React Query key factory — one source of truth per domain so query
 * keys and their invalidation counterparts can never drift apart.
 *
 * Conventions:
 * - Each domain exposes an `all` root; invalidate with that root to clear the
 *   whole domain (e.g. `queryClient.invalidateQueries({ queryKey: queryKeys.courses.all })`).
 * - Id arrays are always sorted so the key is stable regardless of caller order
 *   (avoids cache fragmentation — see CLAUDE.md).
 * - Dictionary lookups live under their own `["dictionary", …]` root, never
 *   `["words", …]`, so invalidating user word entities can't wipe dictionary caches.
 */

import type {
    MyCoursesInfiniteQueryOptions,
    MyCoursesQueryOptions,
} from "@/types/courses/courses.type";
import type { WordProgressScope } from "@/types/word-progress/word-progress.type";

const sortedIds = (ids: string[]): string[] => [...ids].sort();

export const queryKeys = {
    courses: {
        all: ["courses"] as const,
        lessons: (courseId: string) => ["courses", "lessons", courseId] as const,
        list: (o: MyCoursesQueryOptions) =>
            [
                "courses",
                "my-courses",
                o.itemsPerPage,
                o.currentPage,
                o.orderByField,
                o.orderByDirection,
                o.searchQuery,
            ] as const,
        listInfinite: (o: MyCoursesInfiniteQueryOptions) =>
            [
                "courses",
                "my-courses",
                "infinite",
                o.orderByField,
                o.orderByDirection,
                o.searchQuery,
            ] as const,
        totalStats: () => ["courses", "my-courses", "total-stats"] as const,
        detail: (courseId: string) => ["courses", "course-detail", courseId] as const,
    },
    words: {
        all: ["words"] as const,
        byIds: (courseId: string | undefined, wordIds: string[]) =>
            ["words", courseId || "all", sortedIds(wordIds)] as const,
    },
    myWords: {
        all: ["my-words"] as const,
        search: (word: string) => ["my-words", "search", word] as const,
    },
    lessons: {
        all: ["lessons"] as const,
    },
    wordProgress: {
        all: ["word-progress"] as const,
        stats: (courseId?: string, lessonId?: string) =>
            ["word-progress", "stats", courseId, lessonId] as const,
        statsByWordIds: (wordIds: string[]) =>
            ["word-progress", "stats", "by-word-ids", sortedIds(wordIds)] as const,
        statsByCourseIds: (courseIds: string[]) =>
            ["word-progress", "stats", "by-course-ids", sortedIds(courseIds)] as const,
        statsByLessonIds: (lessonIds: string[]) =>
            ["word-progress", "stats", "by-lesson-ids", sortedIds(lessonIds)] as const,
        byWordIds: (wordIds: string[]) =>
            ["word-progress", "by-word-ids", sortedIds(wordIds)] as const,
        word: (wordId: string) => ["word-progress", wordId] as const,
    },
    dueWords: {
        all: ["due-words"] as const,
        list: (o: WordProgressScope) =>
            ["due-words", o.courseId, o.lessonId, o.limit, o.includeNew] as const,
    },
    dueWordIds: {
        all: ["due-word-ids"] as const,
        list: (o: WordProgressScope) =>
            ["due-word-ids", o.courseId, o.lessonId, o.limit, o.includeNew] as const,
        byWordIds: (wordIds: string[], limit?: number, includeNew?: boolean) =>
            ["due-word-ids", "by-word-ids", sortedIds(wordIds), limit, includeNew] as const,
    },
    leeches: {
        all: ["leeches"] as const,
        list: (courseId?: string, lessonId?: string) =>
            ["leeches", courseId, lessonId] as const,
    },
    learningSettings: {
        all: ["learning-settings"] as const,
    },
    preferences: {
        all: ["preferences"] as const,
    },
    dictionary: {
        all: ["dictionary"] as const,
        pronunciation: (word: string) => ["dictionary", "pronunciation", word] as const,
        search: (query: string) => ["dictionary", "search", query] as const,
        langeekDetails: (word: string, partOfSpeech: string) =>
            ["dictionary", "langeek-details", word, partOfSpeech] as const,
    },
    dailyHabit: {
        all: ["daily-habit"] as const,
        byDate: (clientDate: string) => ["daily-habit", clientDate] as const,
    },
    learningReport: {
        all: ["learning-report"] as const,
        byPeriod: (period: string, clientDate: string) =>
            ["learning-report", period, clientDate] as const,
        forecast: (days: number, clientDate: string) =>
            ["learning-report", "forecast", days, clientDate] as const,
        activityCalendar: (clientDate: string) =>
            ["learning-report", "activity-calendar", clientDate] as const,
    },
    userLevel: {
        all: ["user-level"] as const,
    },
    notifications: {
        all: ["notifications"] as const,
        preferences: () => ["notifications", "preferences"] as const,
        vapidPublicKey: () => ["notifications", "vapid-public-key"] as const,
    },
} as const;
