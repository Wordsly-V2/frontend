import {
    createMyCourseLesson,
    deleteMyCourseLesson,
    getLessonsByCourseId,
    reorderMyCourseLessons,
    updateMyCourseLesson,
} from "@/apis/lessons.api";
import { queryKeys } from "@/lib/query-keys";
import { CreateMyLesson, ILessonSummary } from "@/types/courses/courses.type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetLessonsByCourseIdQuery = (courseId: string, enabled: boolean = true) =>
    useQuery<ILessonSummary[]>({
        queryKey: queryKeys.courses.lessons(courseId),
        queryFn: () => getLessonsByCourseId(courseId),
        enabled,
    });

/**
 * Lessons are nested under a course, so their lists and the parent course
 * detail (lesson/word counts, ordering) all live under the `courses` root —
 * every lesson mutation invalidates it.
 */
export const useCreateMyCourseLessonMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ courseId, lesson }: { courseId: string; lesson: CreateMyLesson }) =>
            createMyCourseLesson(courseId, lesson),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
    });
};

export const useUpdateMyCourseLessonMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ courseId, lessonId, lesson }: { courseId: string; lessonId: string; lesson: CreateMyLesson }) =>
            updateMyCourseLesson(courseId, lessonId, lesson),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
    });
};

export const useDeleteMyCourseLessonMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ courseId, lessonId }: { courseId: string; lessonId: string }) =>
            deleteMyCourseLesson(courseId, lessonId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
    });
};

export const useReorderMyCourseLessonsMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ courseId, lessonId, targetOrderIndex }: { courseId: string; lessonId: string; targetOrderIndex: number }) =>
            reorderMyCourseLessons(courseId, lessonId, targetOrderIndex),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
    });
};
