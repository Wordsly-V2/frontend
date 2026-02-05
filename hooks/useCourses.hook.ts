import { createMyCourse, deleteMyCourse, updateMyCourse } from "@/apis/courses.api";
import { CreateUpdateMyCourse } from "@/types/courses/courses.type";
import { useMutation } from "@tanstack/react-query";

export const useCourses = () => {
    const mutationCreateMyCourse = useMutation({
        mutationFn: (courseData: CreateUpdateMyCourse) => createMyCourse(courseData),
    });

    const mutationUpdateMyCourse = useMutation({
        mutationFn: ({ courseId, courseData }: { courseId: string, courseData: CreateUpdateMyCourse }) => updateMyCourse(courseId, courseData),
    });

    const mutationDeleteMyCourse = useMutation({
        mutationFn: (courseId: string) => deleteMyCourse(courseId),
    });
    

    return { mutationCreateMyCourse, mutationUpdateMyCourse, mutationDeleteMyCourse };
};