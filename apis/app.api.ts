import axiosInstance from "@/lib/axios";
import type { AxiosError } from "axios";
import axios from "axios";

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

export const getServiceHealth = async (): Promise<string[]> => {
    try {
        const serviceApiUrls = process.env.NEXT_PUBLIC_SERVICE_API_URLS?.split(',');
        const healthChecks = await Promise.all(serviceApiUrls?.map(url => axios.get(`${url}/health`)) || []);
        return healthChecks.map(response => response.data);
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};