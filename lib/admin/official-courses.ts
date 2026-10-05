import type { OfficialCourse, OfficialCourseStatus } from "@/types/official-courses/official-courses.type";

/** The status filter on `/admin/vocabulary`; `null` is "All". */
export const STATUS_FILTERS: readonly { value: OfficialCourseStatus | null; label: string }[] = [
    { value: null, label: "All" },
    { value: "draft", label: "Drafts" },
    { value: "published", label: "Published" },
];

export function officialStatus(course: { publishedAt: string | null }): OfficialCourseStatus {
    return course.publishedAt ? "published" : "draft";
}

export const STATUS_LABELS: Record<OfficialCourseStatus, string> = {
    draft: "Draft",
    published: "Published",
};

/** How many words a course has across its lessons. */
export function courseWordCount(course: Pick<OfficialCourse, "lessons">): number {
    return course.lessons.reduce((sum, lesson) => sum + (lesson.words?.length ?? 0), 0);
}

/**
 * Why the course can't be published yet, or null when it can. Mirrors the
 * server, which answers 400 for a course without words.
 */
export function publishBlocker(course: Pick<OfficialCourse, "lessons">): string | null {
    if (course.lessons.length === 0) return "Add a lesson and some words first.";
    if (courseWordCount(course) === 0) return "Add at least one word first.";
    return null;
}
