import axiosInstance from "@/lib/axios";

export const healthCheck = async () => {
    try {
        const response = await axiosInstance.get('/health');
        return response.data;
    } catch (error) {
        throw error;
    }
}