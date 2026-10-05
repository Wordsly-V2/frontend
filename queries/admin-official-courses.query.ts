import {
    createOfficialCourse,
    createOfficialLesson,
    createOfficialWord,
    deleteOfficialCourse,
    deleteOfficialLesson,
    deleteOfficialWords,
    getAdminOfficialCourse,
    getAdminOfficialCourses,
    setOfficialCoursePublished,
    updateOfficialCourse,
    updateOfficialLesson,
    updateOfficialWord,
} from "@/apis/admin-official-courses.api";
import { queryKeys } from "@/lib/query-keys";
import type { AdminOfficialCoursesQuery } from "@/types/official-courses/official-courses.type";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Another admin may change these at any time.
const FRESH = { staleTime: 0 } as const;

export const useAdminOfficialCoursesQuery = (query: AdminOfficialCoursesQuery) =>
    useQuery({
        queryKey: queryKeys.adminOfficialCourses.list(query),
        queryFn: () => getAdminOfficialCourses(query),
        placeholderData: keepPreviousData,
        ...FRESH,
    });

export const useAdminOfficialCourseQuery = (courseId: string) =>
    useQuery({
        queryKey: queryKeys.adminOfficialCourses.course(courseId),
        queryFn: () => getAdminOfficialCourse(courseId),
        ...FRESH,
    });

/**
 * Any write refreshes the official courses held here, content health (which
 * counts official words too) and the learners' catalogue, in case this admin
 * is also looking at it.
 */
function useOfficialWrite<V, R>(write: (vars: V) => Promise<R>) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: write,
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.adminOfficialCourses.all }),
                queryClient.invalidateQueries({ queryKey: [...queryKeys.adminVocabulary.all, "health"] }),
                queryClient.invalidateQueries({ queryKey: queryKeys.officialCourses.all }),
            ]);
        },
    });
}

export const useCreateOfficialCourseMutation = () => useOfficialWrite(createOfficialCourse);
export const useUpdateOfficialCourseMutation = () => useOfficialWrite(updateOfficialCourse);
export const useDeleteOfficialCourseMutation = () => useOfficialWrite(deleteOfficialCourse);
export const useSetOfficialCoursePublishedMutation = () => useOfficialWrite(setOfficialCoursePublished);
export const useCreateOfficialLessonMutation = () => useOfficialWrite(createOfficialLesson);
export const useUpdateOfficialLessonMutation = () => useOfficialWrite(updateOfficialLesson);
export const useDeleteOfficialLessonMutation = () => useOfficialWrite(deleteOfficialLesson);
export const useCreateOfficialWordMutation = () => useOfficialWrite(createOfficialWord);
export const useUpdateOfficialWordMutation = () => useOfficialWrite(updateOfficialWord);
export const useDeleteOfficialWordsMutation = () => useOfficialWrite(deleteOfficialWords);
