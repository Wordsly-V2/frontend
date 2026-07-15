import type {
    IReportBucket,
    ReportGranularity,
} from "@/types/learning-report/learning-report.type";

/**
 * Shared recharts Tooltip props. Recharts colors tooltip text with the series
 * color by default; force neutral foreground text so values stay readable.
 */
export const chartTooltipProps = {
    contentStyle: {
        borderRadius: "8px",
        border: "1px solid var(--border)",
        background: "var(--card)",
        fontSize: "12px",
    },
    itemStyle: { color: "var(--foreground)" },
    labelStyle: { color: "var(--muted-foreground)" },
} as const;

const WEEKDAY = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const DAY_MONTH = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
});
const MONTH = new Intl.DateTimeFormat(undefined, { month: "short" });

/** Parse a bucket key into a local Date (daily 'YYYY-MM-DD' or monthly 'YYYY-MM'). */
function bucketDate(key: string): Date {
    const iso = key.length === 7 ? `${key}-01` : key;
    return new Date(`${iso}T00:00:00`);
}

/**
 * Short axis label for a bucket. Weekly → weekday, monthly view → day/month,
 * yearly → month name.
 */
export function formatBucketLabel(
    key: string,
    granularity: ReportGranularity,
    bucketCount: number,
): string {
    const date = bucketDate(key);
    if (granularity === "month") {
        return MONTH.format(date);
    }
    return bucketCount <= 7 ? WEEKDAY.format(date) : DAY_MONTH.format(date);
}

/** Attach a display label to each bucket for charts. */
export function withLabels(
    buckets: IReportBucket[],
    granularity: ReportGranularity,
): Array<IReportBucket & { label: string }> {
    return buckets.map((bucket) => ({
        ...bucket,
        label: formatBucketLabel(bucket.key, granularity, buckets.length),
    }));
}
