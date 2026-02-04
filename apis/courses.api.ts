import axiosInstance from "@/lib/axios";
import { IPaginatedResponse } from "@/types/common/pagination.type";
import { ICourse, ILesson, IWord } from "@/types/courses/courses.type";

export const getMyCourses = async (limit: number = 10, page: number = 1, orderByField: 'createdAt' | 'name' = 'name', orderByDirection: 'asc' | 'desc' = 'desc'): Promise<IPaginatedResponse<ICourse>> => {
    const response = await axiosInstance.get<IPaginatedResponse<ICourse>>('/courses/me/my-courses', {
        params: {
            limit,
            page,
            orderByField,
            orderByDirection,
        },
    });
    return response.data;
}

export const createMyCourse = async (course: Pick<ICourse, 'name' | 'coverImageUrl'>): Promise<ICourse> => {
    const response = await axiosInstance.post<ICourse>('/courses/me/my-courses', course);
    return response.data;
}