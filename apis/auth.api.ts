import axiosInstance from "@/lib/axios";
import type { AxiosError } from "axios";

export const logout = async (): Promise<{ success: boolean }> => {
    try {
        await axiosInstance.post('/auth/logout');
        return { success: true };
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}