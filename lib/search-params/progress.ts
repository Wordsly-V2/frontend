import type { ReportPeriod } from "@/types/learning-report/learning-report.type";
import { parseAsStringLiteral } from "nuqs/server";

export const REPORT_PERIODS = ["week", "month", "year"] as const satisfies readonly ReportPeriod[];

export const progressSearchParams = {
    period: parseAsStringLiteral(REPORT_PERIODS)
        .withDefault("week")
        .withOptions({ clearOnDefault: true }),
};
