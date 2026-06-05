import axiosInstance from "@/lib/axios";
import type {
    IDailyHabit,
    IRecordDailyPracticeDto,
} from "@/types/daily-habit/daily-habit.type";
import { AxiosError } from "axios";

export const getDailyHabit = async (clientDate?: string): Promise<IDailyHabit> => {
    try {
        const response = await axiosInstance.get<IDailyHabit>("/daily-habit", {
            params: { clientDate },
        });
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};

export const recordDailyPractice = async (
    data: IRecordDailyPracticeDto,
): Promise<IDailyHabit> => {
    try {
        const response = await axiosInstance.post<IDailyHabit>(
            "/daily-habit/record-practice",
            data,
        );
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};
