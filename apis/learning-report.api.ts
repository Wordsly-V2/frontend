import axiosInstance from "@/lib/axios";
import { localDateString } from "@/lib/daily-habit";
import type {
    ILearningReport,
    ReportPeriod,
} from "@/types/learning-report/learning-report.type";
import { AxiosError } from "axios";

/** Fetch the learning progress report for a period (week/month/year). */
export const getLearningReport = async (
    period: ReportPeriod,
    clientDate?: string,
): Promise<ILearningReport> => {
    try {
        const response = await axiosInstance.get<ILearningReport>(
            "/learning-report",
            {
                params: {
                    period,
                    clientDate: clientDate ?? localDateString(),
                },
            },
        );
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};
