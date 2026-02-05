import axiosInstance from "@/lib/axios";
import { IPaginatedResponse } from "@/types/common/pagination.type";
import { CreateUpdateMyCourse, ICourse, ICourseTotalStats } from "@/types/courses/courses.type";

export const getMyCourses = async (limit: number = 10, page: number = 1, orderByField: 'createdAt' | 'name' = 'name', orderByDirection: 'asc' | 'desc' = 'asc', searchQuery: string = ""): Promise<IPaginatedResponse<ICourse>> => {
    const response = await axiosInstance.get<IPaginatedResponse<ICourse>>('/courses/me/my-courses', {
        params: {
            limit,
            page,
            orderByField,
            orderByDirection,
            searchQuery,
        },
    });
    return response.data;
}

export const createMyCourse = async (course: CreateUpdateMyCourse): Promise<{ success: boolean }> => {
    const response = await axiosInstance.post<{ success: boolean }>('/courses/me/my-courses', course);
    return response.data;
}

export const getMyCoursesTotalStats = async (): Promise<ICourseTotalStats> => {
    const response = await axiosInstance.get<ICourseTotalStats>('/courses/me/my-courses/total-stats');
    return response.data;
}

export const deleteMyCourse = async (courseId: string): Promise<{ success: boolean }> => {
    const response = await axiosInstance.delete<{ success: boolean }>(`/courses/me/my-courses/${courseId}`);
    return response.data;
}

export const updateMyCourse = async (courseId: string, course: CreateUpdateMyCourse): Promise<{ success: boolean }> => {
    const response = await axiosInstance.put<{ success: boolean }>(`/courses/me/my-courses/${courseId}`, course);
    return response.data;
}

export const getCourseDetailById = async (courseId: string): Promise<ICourse> => {
    const response = await axiosInstance.get<ICourse>(`/courses/me/my-courses/${courseId}`);
    return response.data;
}