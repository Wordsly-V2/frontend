import { REPORT_RANGE_DAYS } from "@/lib/admin/stats";
import { parseAsNumberLiteral, parseAsStringLiteral } from "nuqs/server";

export const ADMIN_REPORT_TABS = ["growth", "learning", "path", "content"] as const;
export type AdminReportTab = (typeof ADMIN_REPORT_TABS)[number];

/** `/admin/reports`: which tab and how many days, in the URL so a view can be shared. */
export const adminReportsSearchParams = {
    tab: parseAsStringLiteral(ADMIN_REPORT_TABS).withDefault("growth").withOptions({ clearOnDefault: true }),
    days: parseAsNumberLiteral(REPORT_RANGE_DAYS).withDefault(30).withOptions({ clearOnDefault: true }),
};
