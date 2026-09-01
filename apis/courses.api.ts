import { apiPaths } from "@/lib/api-paths";
import { request } from "@/lib/axios";
import { IPaginatedResponse } from "@/types/common/pagination.type";
import { CreateUpdateMyCourse, ICourse, ICourseTotalStats, MyCoursesQueryOptions } from "@/types/courses/courses.type";

export const getMyCourses = (options: MyCoursesQueryOptions = {}): Promise<IPaginatedResponse<ICourse>> => {
    const {
        itemsPerPage = 10,
        currentPage = 1,
        orderByField = "name",
        orderByDirection = "asc",
        searchQuery = "",
    } = options;
    return request((i) => i.get(apiPaths.courses.root(), {
        params: { limit: itemsPerPage, page: currentPage, orderByField, orderByDirection, searchQuery },
    }));
};

export const createMyCourse = (course: CreateUpdateMyCourse): Promise<{ success: boolean }> =>
    request((i) => i.post(apiPaths.courses.root(), course));

export const getMyCoursesTotalStats = (): Promise<ICourseTotalStats> =>
    request((i) => i.get(apiPaths.courses.totalStats()));

export const deleteMyCourse = (courseId: string): Promise<{ success: boolean }> =>
    request((i) => i.delete(apiPaths.courses.byId(courseId)));

export const updateMyCourse = (courseId: string, course: CreateUpdateMyCourse): Promise<{ success: boolean }> =>
    request((i) => i.put(apiPaths.courses.byId(courseId), course));

export const getCourseDetailById = (courseId: string): Promise<ICourse> =>
    request((i) => i.get(apiPaths.courses.byId(courseId)));
