import {
    MAX_REPORT_OFFSET,
    type ReportPeriod,
} from "@/types/learning-report/learning-report.type";
import { parseAsInteger, parseAsStringLiteral } from "nuqs/server";

export const REPORT_PERIODS = ["week", "month", "year"] as const satisfies readonly ReportPeriod[];

export const progressSearchParams = {
    period: parseAsStringLiteral(REPORT_PERIODS)
        .withDefault("week")
        .withOptions({ clearOnDefault: true }),
    // Whole periods back from today; 0 is the window ending today.
    offset: parseAsInteger
        .withDefault(0)
        .withOptions({ clearOnDefault: true }),
};

/** Keep a URL-supplied offset inside the range the API accepts. */
export const clampReportOffset = (offset: number) =>
    Math.min(MAX_REPORT_OFFSET, Math.max(0, Math.trunc(offset)));
