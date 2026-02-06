import { createMyCourseLesson, deleteMyCourseLesson, reorderMyCourseLessons, updateMyCourseLesson } from "@/apis/lesssons.api";
import { CreateMyLesson } from "@/types/courses/courses.type";
import { useMutation } from "@tanstack/react-query";

export const useLessons = () => {
    const mutationCreateMyCourseLesson = useMutation({
        mutationFn: ({ courseId, lesson }: { courseId: string, lesson: CreateMyLesson }) => createMyCourseLesson(courseId, lesson),
    });

    const mutationUpdateMyCourseLesson = useMutation({
        mutationFn: ({ courseId, lessonId, lesson }: { courseId: string, lessonId: string, lesson: CreateMyLesson }) => updateMyCourseLesson(courseId, lessonId, lesson),
    });

    const mutationDeleteMyCourseLesson = useMutation({
        mutationFn: ({ courseId, lessonId }: { courseId: string, lessonId: string }) => deleteMyCourseLesson(courseId, lessonId),
    });

    const mutationReorderMyCourseLessons = useMutation({
        mutationFn: ({ courseId, lessonId, targetOrderIndex }: { courseId: string, lessonId: string, targetOrderIndex: number }) => reorderMyCourseLessons(courseId, lessonId, targetOrderIndex),
    });

    return { mutationCreateMyCourseLesson, mutationUpdateMyCourseLesson, mutationDeleteMyCourseLesson, mutationReorderMyCourseLessons };
};