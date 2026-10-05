import type { ICourse, ICourseTotalStats } from "@/types/courses/courses.type";
import type { IPaginatedResponse } from "@/types/common/pagination.type";

/** `GET /admin/vocabulary/users/:id/courses` (newest first). */
export interface AdminUserCourses {
    stats: ICourseTotalStats;
    courses: IPaginatedResponse<ICourse>;
}

export interface AdminUserCoursesQuery {
    page?: number;
    limit?: number;
    searchQuery?: string;
}

/** Words missing each kind of content ("missing" = null or blank). */
export interface MissingCounts {
    /** No UK, US or plain pronunciation. */
    ipa: number;
    /** No audio of any kind. */
    audio: number;
    meaning: number;
    example: number;
    image: number;
}

export interface CourseHealth {
    courseId: string;
    name: string;
    /** The owner; null for an official course. */
    userLoginId: string | null;
    words: number;
    missing: MissingCounts;
    /** Missing IPA, audio, meaning or example (image is optional). */
    incompleteWords: number;
}

/** `GET /admin/vocabulary/health`. */
export interface ContentHealth {
    totals: { courses: number; lessons: number; words: number; owners: number };
    missing: MissingCounts;
    incompleteWords: number;
    worstCourses: CourseHealth[];
}
