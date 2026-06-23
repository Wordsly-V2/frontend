"use client";

import { Button } from "@/components/ui/button";
import {
    REPORT_PERIOD_LABELS,
    type ReportPeriod,
} from "@/types/learning-report/learning-report.type";

const PERIODS: ReportPeriod[] = ["week", "month", "year"];

interface ReportPeriodToggleProps {
    value: ReportPeriod;
    onChange: (period: ReportPeriod) => void;
}

export function ReportPeriodToggle({
    value,
    onChange,
}: Readonly<ReportPeriodToggleProps>) {
    return (
        <div
            role="tablist"
            aria-label="Report period"
            className="flex items-center rounded-xl border border-border/70 bg-muted/40 p-0.5 dark:bg-muted/25"
        >
            {PERIODS.map((period) => {
                const active = period === value;
                return (
                    <Button
                        key={period}
                        role="tab"
                        aria-selected={active}
                        variant={active ? "default" : "ghost"}
                        size="sm"
                        className={`rounded-lg px-3 ${active ? "shadow-sm" : ""}`}
                        onClick={() => onChange(period)}
                    >
                        {REPORT_PERIOD_LABELS[period]}
                    </Button>
                );
            })}
        </div>
    );
}
