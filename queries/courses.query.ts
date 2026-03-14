import { getLessonsByCourseId } from "@/apis/lesssons.api";
import { getCourseDetailById, getMyCourses, getMyCoursesTotalStats } from "@/apis/courses.api";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { IPaginatedResponse } from "@/types/common/pagination.type";
import { ICourse, ICourseTotalStats, ILessonSummary } from "@/types/courses/courses.type";

export const useGetLessonsByCourseIdQuery = (courseId: string, enabled: boolean = true) =>
    useQuery<ILessonSummary[]>({
        queryKey: ["courses", "get", "lessons", courseId],
        queryFn: () => getLessonsByCourseId(courseId),
        enabled,
    });

export const useGetMyCoursesQuery = (
    itemsPerPage: number = 10,
    currentPage: number = 1,
    orderByField: 'createdAt' | 'name' = 'name',
    orderByDirection: 'asc' | 'desc' = 'asc',
    searchQuery: string = "",
    enabled: boolean = true
) => useQuery<IPaginatedResponse<ICourse>>({
    queryKey: ['courses', 'get', 'my-courses', itemsPerPage, currentPage, orderByField, orderByDirection, searchQuery],
    queryFn: () => getMyCourses(itemsPerPage, currentPage, orderByField, orderByDirection, searchQuery),
    enabled,
});

export const useGetMyCoursesTotalStatsQuery = () => useQuery<ICourseTotalStats>({
    queryKey: ['courses', 'get', 'my-courses', 'total-stats'],
    queryFn: () => getMyCoursesTotalStats(),
});

export const useGetCourseDetailByIdQuery = (courseId: string, enabled: boolean = true) =>
    useQuery<ICourse>({
        queryKey: ["courses", "get", "course-detail", courseId],
        queryFn: () => getCourseDetailById(courseId),
        enabled,
    });

const COURSES_PAGE_SIZE = 10;

export const useGetMyCoursesInfiniteQuery = (
    orderByField: "createdAt" | "name" = "name",
    orderByDirection: "asc" | "desc" = "asc",
    searchQuery: string = "",
    enabled: boolean = true
) =>
    useInfiniteQuery<IPaginatedResponse<ICourse>>({
        queryKey: [
            "courses",
            "get",
            "my-courses",
            "infinite",
            orderByField,
            orderByDirection,
            searchQuery,
        ],
        queryFn: ({ pageParam }) =>
            getMyCourses(
                COURSES_PAGE_SIZE,
                pageParam as number,
                orderByField,
                orderByDirection,
                searchQuery
            ),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.currentPage < lastPage.totalPages
                ? lastPage.currentPage + 1
                : undefined,
        enabled,
    });