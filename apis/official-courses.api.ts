import { apiPaths } from "@/lib/api-paths";
import { request } from "@/lib/axios";
import type { IPaginatedResponse } from "@/types/common/pagination.type";
import type { ICourse } from "@/types/courses/courses.type";
import type {
    OfficialCourse,
    OfficialCourseCard,
    OfficialCoursesQuery,
} from "@/types/official-courses/official-courses.type";

/** Published official courses, newest first, each with your copy of it if you have one. */
export const getOfficialCourses = (query: OfficialCoursesQuery): Promise<IPaginatedResponse<OfficialCourseCard>> =>
    request((i) => i.get(apiPaths.officialCourses.root(), { params: query }));

/** A published course with its lessons and words, to look at before adding it. */
export const getOfficialCourse = (courseId: string): Promise<OfficialCourse> =>
    request((i) => i.get(apiPaths.officialCourses.byId(courseId)));

/** Copies it into your library; answers with your new course. */
export const copyOfficialCourse = (courseId: string): Promise<ICourse> =>
    request((i) => i.post(apiPaths.officialCourses.copy(courseId)));
