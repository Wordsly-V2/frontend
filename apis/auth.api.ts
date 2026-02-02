import axiosInstance from "@/lib/axios";

export const logout = async (): Promise<{ success: boolean }> => {
    try {
        await axiosInstance.post('/auth/logout');
        return { success: true };
    } catch (error) {
        throw error;
    }
}