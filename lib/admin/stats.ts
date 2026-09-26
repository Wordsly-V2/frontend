import type { DateRange } from "@/types/admin-stats/admin-stats.type";

/** The report ranges an admin can pick, in days. */
export const REPORT_RANGE_DAYS = [7, 30, 90] as const;
export type ReportRangeDays = (typeof REPORT_RANGE_DAYS)[number];

/** `YYYY-MM-DD` of a date on the viewer's own calendar. */
export function localIsoDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The `days` days ending today (inclusive), on the viewer's calendar. */
export function lastDays(days: number, today: Date = new Date()): DateRange {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1));
    return { from: localIsoDate(start), to: localIsoDate(today) };
}

/** `part / whole`, or `null` when there is nothing to divide. */
export function ratio(part: number, whole: number): number | null {
    return whole > 0 ? part / whole : null;
}

/** "72%" or an en dash for no data. */
export function formatPercent(value: number | null): string {
    return value === null ? "–" : `${Math.round(value * 100)}%`;
}

/** Daily accuracy as a percentage; days without answers are gaps, not 0%. */
export function dailyAccuracy(
    daily: readonly { date: string; reviews: number; correctReviews: number }[],
): { date: string; value: number | null }[] {
    return daily.map((day) => {
        const r = ratio(day.correctReviews, day.reviews);
        return { date: day.date, value: r === null ? null : Math.round(r * 1000) / 10 };
    });
}

const SHORT_DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/** "26 Sep" for a `YYYY-MM-DD` day (read as a calendar day, no zone shift). */
export function shortDay(isoDay: string): string {
    const [y, m, d] = isoDay.split("-").map(Number);
    return SHORT_DAY.format(new Date(y, m - 1, d));
}

/**
 * Background strength for a retention cell, 0.06–0.9: faint but visible at
 * 0 so the grid still reads as a grid, never full so the number stays legible.
 */
export function retentionShade(value: number): number {
    const clamped = Math.min(1, Math.max(0, value));
    return Math.round((0.06 + clamped * 0.84) * 100) / 100;
}
