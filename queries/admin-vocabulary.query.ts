import {
    deleteAdminUserCourse,
    deleteAdminUserLesson,
    deleteAdminUserWords,
    getAdminUserCourse,
    getAdminUserCourses,
    getContentHealth,
    updateAdminUserCourse,
    updateAdminUserLesson,
    updateAdminUserWord,
} from "@/apis/admin-vocabulary.api";
import { queryKeys } from "@/lib/query-keys";
import type { AdminUserCoursesQuery } from "@/types/admin-vocabulary/admin-vocabulary.type";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Another admin, or the learner, may change these at any time.
const FRESH = { staleTime: 0 } as const;

export const useContentHealthQuery = (limit = 10) =>
    useQuery({
        queryKey: queryKeys.adminVocabulary.health(limit),
        queryFn: () => getContentHealth(limit),
        ...FRESH,
    });

export const useAdminUserCoursesQuery = (userLoginId: string, query: AdminUserCoursesQuery) =>
    useQuery({
        queryKey: queryKeys.adminVocabulary.courses(userLoginId, query),
        queryFn: () => getAdminUserCourses(userLoginId, query),
        placeholderData: keepPreviousData,
        ...FRESH,
    });

export const useAdminUserCourseQuery = (userLoginId: string, courseId: string | null) =>
    useQuery({
        queryKey: queryKeys.adminVocabulary.course(userLoginId, courseId ?? ""),
        queryFn: () => getAdminUserCourse(userLoginId, courseId ?? ""),
        enabled: courseId !== null,
        ...FRESH,
    });

/**
 * Any change to a learner's vocabulary refreshes everything held about them
 * here, content health, and their learning numbers (a delete drops cards).
 */
function useVocabularyWrite<V extends { userLoginId: string }, R>(write: (vars: V) => Promise<R>) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: write,
        onSuccess: async (_result, { userLoginId }) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.adminVocabulary.user(userLoginId) }),
                queryClient.invalidateQueries({ queryKey: [...queryKeys.adminVocabulary.all, "health"] }),
                queryClient.invalidateQueries({ queryKey: queryKeys.adminLearners.user(userLoginId) }),
                queryClient.invalidateQueries({ queryKey: queryKeys.adminLearners.summaries() }),
            ]);
        },
    });
}

export const useUpdateAdminUserCourseMutation = () => useVocabularyWrite(updateAdminUserCourse);
export const useDeleteAdminUserCourseMutation = () => useVocabularyWrite(deleteAdminUserCourse);
export const useUpdateAdminUserLessonMutation = () => useVocabularyWrite(updateAdminUserLesson);
export const useDeleteAdminUserLessonMutation = () => useVocabularyWrite(deleteAdminUserLesson);
export const useUpdateAdminUserWordMutation = () => useVocabularyWrite(updateAdminUserWord);
export const useDeleteAdminUserWordsMutation = () => useVocabularyWrite(deleteAdminUserWords);
