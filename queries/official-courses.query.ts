import { copyOfficialCourse, getOfficialCourse, getOfficialCourses } from "@/apis/official-courses.api";
import { queryKeys } from "@/lib/query-keys";
import type { OfficialCoursesQuery } from "@/types/official-courses/official-courses.type";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useOfficialCoursesQuery = (query: OfficialCoursesQuery) =>
    useQuery({
        queryKey: queryKeys.officialCourses.list(query),
        queryFn: () => getOfficialCourses(query),
        placeholderData: keepPreviousData,
    });

export const useOfficialCourseQuery = (courseId: string | null) =>
    useQuery({
        queryKey: queryKeys.officialCourses.detail(courseId ?? ""),
        queryFn: () => getOfficialCourse(courseId ?? ""),
        enabled: courseId !== null,
    });

/** The copy is a new course of yours: refresh your library and the catalogue's "in your library". */
export const useCopyOfficialCourseMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: copyOfficialCourse,
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
                queryClient.invalidateQueries({ queryKey: queryKeys.officialCourses.all }),
            ]);
        },
    });
};
