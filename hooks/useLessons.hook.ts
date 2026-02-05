import { createMyCourseLesson, deleteMyCourseLesson, updateMyCourseLesson } from "@/apis/lesssons.api";
import { CreateMyCourseLesson } from "@/types/courses/courses.type";
import { useMutation } from "@tanstack/react-query";

export const useLessons = () => {
    const mutationCreateMyCourseLesson = useMutation({
        mutationFn: ({ courseId, lesson }: { courseId: string, lesson: CreateMyCourseLesson }) => createMyCourseLesson(courseId, lesson),
    });

    const mutationUpdateMyCourseLesson = useMutation({
        mutationFn: ({ courseId, lessonId, lesson }: { courseId: string, lessonId: string, lesson: CreateMyCourseLesson }) => updateMyCourseLesson(courseId, lessonId, lesson),
    });

    const mutationDeleteMyCourseLesson = useMutation({
        mutationFn: ({ courseId, lessonId }: { courseId: string, lessonId: string }) => deleteMyCourseLesson(courseId, lessonId),
    });

    return { mutationCreateMyCourseLesson, mutationUpdateMyCourseLesson, mutationDeleteMyCourseLesson };
};