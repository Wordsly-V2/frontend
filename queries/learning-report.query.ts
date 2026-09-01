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
    offset = 0,
) => queryKeys.learningReport.byPeriod(period, clientDate, offset);

export const useGetLearningReportQuery = (
    period: ReportPeriod,
    enabled = true,
    offset = 0,
) => {
    const clientDate = localDateString();

    return useQuery<ILearningReport>({
        queryKey: learningReportQueryKey(period, clientDate, offset),
        queryFn: () => getLearningReport(period, clientDate, offset),
        enabled,
        staleTime: 60_000,
        // Past windows never change, so keep the old chart on screen while the
        // next one loads instead of flashing the page skeleton on every step.
        placeholderData: (previous) => previous,
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
