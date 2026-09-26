"use client";

import { FilterToggle } from "@/components/features/admin/filter-toggle";
import { lastDays, REPORT_RANGE_DAYS } from "@/lib/admin/stats";
import { adminReportsSearchParams, type AdminReportTab } from "@/lib/search-params/admin-reports";
import { useQueryStates } from "nuqs";
import { useMemo } from "react";
import { ContentReport, GrowthReport, LearningReport, PathReport } from "./report-sections";

const TAB_OPTIONS = [
    { value: "growth", label: "Growth" },
    { value: "learning", label: "Learning" },
    { value: "path", label: "Wordsly Path" },
    { value: "content", label: "Content" },
] as const satisfies readonly { value: AdminReportTab; label: string }[];

const RANGE_OPTIONS = REPORT_RANGE_DAYS.map((days) => ({ value: days, label: `${days} days` }));

/** /admin/reports: one tab per area, all for the same trailing range of days. */
export function AdminReportsScreen() {
    const [{ tab, days }, setParams] = useQueryStates(adminReportsSearchParams, { history: "replace" });
    // Today on the admin's calendar; the range only moves when `days` does.
    const range = useMemo(() => lastDays(days), [days]);

    return (
        <div className="space-y-5">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Reports</h1>
                    <p className="text-sm text-muted-foreground">How people find, use and stick with Wordsly.</p>
                </div>
                {tab !== "content" ? (
                    <FilterToggle
                        label="Range"
                        value={days}
                        options={RANGE_OPTIONS}
                        onChange={(value) => void setParams({ days: value ?? 30 })}
                    />
                ) : null}
            </header>

            <div className="overflow-x-auto">
                <div className="w-max">
                    <FilterToggle
                        label="Report"
                        value={tab}
                        options={TAB_OPTIONS}
                        onChange={(value) => void setParams({ tab: value ?? "growth" }, { history: "push" })}
                    />
                </div>
            </div>

            {tab === "growth" && <GrowthReport range={range} />}
            {tab === "learning" && <LearningReport range={range} />}
            {tab === "path" && <PathReport range={range} />}
            {tab === "content" && <ContentReport />}
        </div>
    );
}
