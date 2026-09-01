import { request } from "@/lib/axios";
import { localDateString } from "@/lib/daily-habit";
import type {
    IActivityCalendar,
    ILearningReport,
    IReviewForecast,
    ReportPeriod,
} from "@/types/learning-report/learning-report.type";

/**
 * Fetch the learning progress report for a period (week/month/year).
 * `offset` pages the same-sized window into the past: 0 is the window ending
 * today, 1 the whole window before that, and so on.
 */
export const getLearningReport = (
    period: ReportPeriod,
    clientDate?: string,
    offset = 0,
): Promise<ILearningReport> =>
    request((i) => i.get("/learning-report", {
        params: { period, clientDate: clientDate ?? localDateString(), offset },
    }));

/** Upcoming-review forecast over the next 7 or 30 days. */
export const getReviewForecast = (
    days: number,
    clientDate?: string,
): Promise<IReviewForecast> =>
    request((i) => i.get("/learning-report/forecast", {
        params: { days, clientDate: clientDate ?? localDateString() },
    }));

/** Day-by-day practice activity for the heatmap. */
export const getActivityCalendar = (
    clientDate?: string,
): Promise<IActivityCalendar> =>
    request((i) => i.get("/learning-report/activity-calendar", {
        params: { clientDate: clientDate ?? localDateString() },
    }));
