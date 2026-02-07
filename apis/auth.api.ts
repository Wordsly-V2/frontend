import axiosInstance from "@/lib/axios";
import type { AxiosError } from "axios";

export const logout = async (isLoggedOutFromAllDevices?: boolean): Promise<{ success: boolean }> => {
    try {
        const response = await axiosInstance.post<{ success: boolean }>('/auth/logout', {
            isLoggedOutFromAllDevices,
        });
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}