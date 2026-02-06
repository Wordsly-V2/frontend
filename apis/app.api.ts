import axiosInstance from "@/lib/axios";
import type { AxiosError } from "axios";

export type ServiceHealth = {
    name: string;
    status: 'healthy' | 'unhealthy';
    message: string;
};

export const healthCheck = async (): Promise<ServiceHealth[]> => {
    try {
        const response = await axiosInstance.get('/health');
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
}