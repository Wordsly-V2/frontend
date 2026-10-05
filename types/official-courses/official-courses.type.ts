import type { ICourse, ILesson } from "@/types/courses/courses.type";

/**
 * Official courses: made by admins (vocabulary-service, `userLoginId` null),
 * listed for learners once published, and copied into a learner's library.
 * Shapes copied from vocabulary-service `src/official-courses/dto`.
 */

/** An official course is a draft until an admin publishes it. */
export const OFFICIAL_COURSE_STATUSES = ["draft", "published"] as const;
export type OfficialCourseStatus = (typeof OFFICIAL_COURSE_STATUSES)[number];

/** One official course in a list. */
export interface OfficialCourseSummary {
    id: string;
    name: string;
    coverImageUrl: string | null;
    /** Null while it is a draft. */
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    totalLessonsCount: number;
    totalWordsCount: number;
}

/** A published course in the learners' catalogue. */
export interface OfficialCourseCard extends OfficialCourseSummary {
    /** The learner's newest copy of it in their library, if any. */
    copiedCourseId: string | null;
}

/** One official course with its lessons, in order, and their words. */
export interface OfficialCourse extends Omit<ICourse, "coverImageUrl" | "lessons"> {
    coverImageUrl: string | null;
    publishedAt: string | null;
    lessons: ILesson[];
}

export interface OfficialCoursesQuery {
    page?: number;
    limit?: number;
    searchQuery?: string;
}

export interface AdminOfficialCoursesQuery extends OfficialCoursesQuery {
    status?: OfficialCourseStatus;
}
