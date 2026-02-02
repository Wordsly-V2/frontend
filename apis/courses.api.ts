import axiosInstance from "@/lib/axios";

export const getMyCourses = async () => {
    try {
        const response = await axiosInstance.get('/courses/me/my-courses');
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const createMyCourses = async (payload: { courses: Array<{ name: string; coverImageUrl?: string }> }) => {
    try {
        const response = await axiosInstance.post('/courses/me/my-courses', payload);
        return response.data;
    } catch (error) {
        throw error;
    }
}