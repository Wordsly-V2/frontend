import { request } from "@/lib/axios";
import { localDateString } from "@/lib/daily-habit";
import type {
    ILearningReport,
    ReportPeriod,
} from "@/types/learning-report/learning-report.type";

/** Fetch the learning progress report for a period (week/month/year). */
export const getLearningReport = (
    period: ReportPeriod,
    clientDate?: string,
): Promise<ILearningReport> =>
    request((i) => i.get("/learning-report", {
        params: { period, clientDate: clientDate ?? localDateString() },
    }));
