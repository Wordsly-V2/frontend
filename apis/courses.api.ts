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
    return request((i) => i.get('/courses/me/my-courses', {
        params: { limit: itemsPerPage, page: currentPage, orderByField, orderByDirection, searchQuery },
    }));
};

export const createMyCourse = (course: CreateUpdateMyCourse): Promise<{ success: boolean }> =>
    request((i) => i.post('/courses/me/my-courses', course));

export const getMyCoursesTotalStats = (): Promise<ICourseTotalStats> =>
    request((i) => i.get('/courses/me/my-courses/total-stats'));

export const deleteMyCourse = (courseId: string): Promise<{ success: boolean }> =>
    request((i) => i.delete(`/courses/me/my-courses/${courseId}`));

export const updateMyCourse = (courseId: string, course: CreateUpdateMyCourse): Promise<{ success: boolean }> =>
    request((i) => i.put(`/courses/me/my-courses/${courseId}`, course));

export const getCourseDetailById = (courseId: string): Promise<ICourse> =>
    request((i) => i.get(`/courses/me/my-courses/${courseId}`));
