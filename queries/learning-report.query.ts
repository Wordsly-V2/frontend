import { getLearningReport } from "@/apis/learning-report.api";
import { localDateString } from "@/lib/daily-habit";
import type {
    ILearningReport,
    ReportPeriod,
} from "@/types/learning-report/learning-report.type";
import { useQuery } from "@tanstack/react-query";

export const learningReportQueryKey = (
    period: ReportPeriod,
    clientDate: string,
) => ["learning-report", period, clientDate] as const;

export const useGetLearningReportQuery = (
    period: ReportPeriod,
    enabled = true,
) => {
    const clientDate = localDateString();

    return useQuery<ILearningReport>({
        queryKey: learningReportQueryKey(period, clientDate),
        queryFn: () => getLearningReport(period, clientDate),
        enabled,
        staleTime: 60_000,
    });
};
