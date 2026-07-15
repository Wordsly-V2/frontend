import {
    getActivityCalendar,
    getLearningReport,
    getReviewForecast,
} from "@/apis/learning-report.api";
import { localDateString } from "@/lib/daily-habit";
import type {
    IActivityCalendar,
    ILearningReport,
    IReviewForecast,
    ReportPeriod,
} from "@/types/learning-report/learning-report.type";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

export const learningReportQueryKey = (
    period: ReportPeriod,
    clientDate: string,
) => queryKeys.learningReport.byPeriod(period, clientDate);

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

export const useGetReviewForecastQuery = (
    days: number,
    enabled = true,
) => {
    const clientDate = localDateString();

    return useQuery<IReviewForecast>({
        queryKey: queryKeys.learningReport.forecast(days, clientDate),
        queryFn: () => getReviewForecast(days, clientDate),
        enabled,
        staleTime: 60_000,
    });
};

export const useGetActivityCalendarQuery = (enabled = true) => {
    const clientDate = localDateString();

    return useQuery<IActivityCalendar>({
        queryKey: queryKeys.learningReport.activityCalendar(clientDate),
        queryFn: () => getActivityCalendar(clientDate),
        enabled,
        staleTime: 60_000,
    });
};
