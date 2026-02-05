import { createMyCourse, deleteMyCourse, updateMyCourse } from "@/apis/courses.api";
import { ICourse } from "@/types/courses/courses.type";
import { useMutation } from "@tanstack/react-query";

export const useCourses = () => {
    const mutationCreateMyCourse = useMutation({
        mutationFn: (courseData: Pick<ICourse, 'name' | 'coverImageUrl'>) => createMyCourse(courseData),
    });

    const mutationUpdateMyCourse = useMutation({
        mutationFn: ({ courseId, courseData }: { courseId: string, courseData: Pick<ICourse, 'name' | 'coverImageUrl'> }) => updateMyCourse(courseId, courseData),
    });

    const mutationDeleteMyCourse = useMutation({
        mutationFn: (courseId: string) => deleteMyCourse(courseId),
    });
    

    return { mutationCreateMyCourse, mutationUpdateMyCourse, mutationDeleteMyCourse };
};