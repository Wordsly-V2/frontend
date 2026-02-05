import { getCourseDetailById, getMyCourses, getMyCoursesTotalStats } from "@/apis/courses.api";
import { useQuery } from "@tanstack/react-query";
import { IPaginatedResponse } from "@/types/common/pagination.type";
import { ICourse, ICourseTotalStats } from "@/types/courses/courses.type";

export const useGetMyCoursesQuery = (itemsPerPage: number = 10, currentPage: number = 1, orderByField: 'createdAt' | 'name' = 'name', orderByDirection: 'asc' | 'desc' = 'asc') => useQuery<IPaginatedResponse<ICourse>>({
    queryKey: ['courses', 'get', 'my-courses', itemsPerPage, currentPage, orderByField, orderByDirection],
    queryFn: () => getMyCourses(itemsPerPage, currentPage, orderByField, orderByDirection),
});

export const useGetMyCoursesTotalStatsQuery = () => useQuery<ICourseTotalStats>({
    queryKey: ['courses', 'get', 'my-courses', 'total-stats'],
    queryFn: () => getMyCoursesTotalStats(),
});

export const useGetCourseDetailByIdQuery = (courseId: string) => useQuery<ICourse>({
    queryKey: ['courses', 'get', 'course-detail', courseId],
    queryFn: () => getCourseDetailById(courseId),
});