import axiosInstance from "@/lib/axios";
import { IUserProfile } from "@/types/users/users.type";

export const getUserProfile = async () => {
    try {
        const response = await axiosInstance.get<IUserProfile>('/users/me/profile');
        return response.data;
    } catch (error) {
        throw error;
    }
}