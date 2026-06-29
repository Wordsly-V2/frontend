import axiosInstance from "@/lib/axios";
import type { IUserLevel } from "@/types/user-level/user-level.type";
import { AxiosError } from "axios";

/** Fetch the current user's learning level (numeric level, rank, XP progress). */
export const getUserLevel = async (): Promise<IUserLevel> => {
    try {
        const response = await axiosInstance.get<IUserLevel>("/user-level");
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};
