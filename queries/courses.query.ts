import {
    createMyCourse,
    deleteMyCourse,
    getCourseDetailById,
    getMyCourses,
    getMyCoursesTotalStats,
    updateMyCourse,
} from "@/apis/courses.api";
import { queryKeys } from "@/lib/query-keys";
import { IPaginatedResponse } from "@/types/common/pagination.type";
import {
    CreateUpdateMyCourse,
    ICourse,
    ICourseTotalStats,
    MyCoursesInfiniteQueryOptions,
    MyCoursesQueryOptions,
} from "@/types/courses/courses.type";
import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

export const useGetMyCoursesQuery = (
    options: MyCoursesQueryOptions = {},
    enabled: boolean = true,
) =>
    useQuery<IPaginatedResponse<ICourse>>({
        queryKey: queryKeys.courses.list(options),
        queryFn: () => getMyCourses(options),
        enabled,
    });

export const useGetMyCoursesTotalStatsQuery = () =>
    useQuery<ICourseTotalStats>({
        queryKey: queryKeys.courses.totalStats(),
        queryFn: () => getMyCoursesTotalStats(),
    });

export const useGetCourseDetailByIdQuery = (courseId: string, enabled: boolean = true) =>
    useQuery<ICourse>({
        queryKey: queryKeys.courses.detail(courseId),
        queryFn: () => getCourseDetailById(courseId),
        enabled,
    });

const COURSES_PAGE_SIZE = 10;

export const useGetMyCoursesInfiniteQuery = (
    options: MyCoursesInfiniteQueryOptions = {},
    enabled: boolean = true,
) =>
    useInfiniteQuery<IPaginatedResponse<ICourse>>({
        queryKey: queryKeys.courses.listInfinite(options),
        queryFn: ({ pageParam }) =>
            getMyCourses({
                ...options,
                itemsPerPage: COURSES_PAGE_SIZE,
                currentPage: pageParam as number,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.currentPage < lastPage.totalPages
                ? lastPage.currentPage + 1
                : undefined,
        enabled,
    });

/**
 * Course create/update/delete all change the course library, per-course detail,
 * and total stats — so every mutation invalidates the whole `courses` root.
 */
export const useCreateMyCourseMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (course: CreateUpdateMyCourse) => createMyCourse(course),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
    });
};

export const useUpdateMyCourseMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ courseId, courseData }: { courseId: string; courseData: CreateUpdateMyCourse }) =>
            updateMyCourse(courseId, courseData),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
    });
};

export const useDeleteMyCourseMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (courseId: string) => deleteMyCourse(courseId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
    });
};
