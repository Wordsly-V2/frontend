import { getMyCourses } from "@/apis/courses.api";
import { useQuery } from "@tanstack/react-query";
import { IPaginatedResponse } from "@/types/common/pagination.type";
import { ICourse } from "@/types/courses/courses.type";

export const useGetMyCoursesQuery = (itemsPerPage: number = 10, currentPage: number = 1, orderByField: 'createdAt' | 'name' = 'name', orderByDirection: 'asc' | 'desc' = 'desc') => useQuery<IPaginatedResponse<ICourse>>({
    queryKey: ['courses', 'get', 'my-courses', itemsPerPage, currentPage, orderByField, orderByDirection],
    queryFn: () => getMyCourses(itemsPerPage, currentPage, orderByField, orderByDirection),
});