"use client";

import {
    CalendarCheck,
    type LucideIcon,
    RotateCcw,
    Sparkles,
    Target,
} from "lucide-react";
import type { IReportSummary } from "@/types/learning-report/learning-report.type";

interface ReportSummaryCardsProps {
    summary: IReportSummary;
    hasAccuracy: boolean;
}

function StatCard({
    icon: Icon,
    label,
    value,
    hint,
}: Readonly<{
    icon: LucideIcon;
    label: string;
    value: string;
    hint?: string;
}>) {
    return (
        <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground">
                {value}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
            {hint && (
                <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                    {hint}
                </p>
            )}
        </div>
    );
}

export function ReportSummaryCards({
    summary,
    hasAccuracy,
}: Readonly<ReportSummaryCardsProps>) {
    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
                icon={Sparkles}
                label="New words"
                value={summary.newWords.toLocaleString()}
                hint="Learned for the first time"
            />
            <StatCard
                icon={RotateCcw}
                label="Words reviewed"
                value={summary.reviewedWords.toLocaleString()}
                hint="Practiced again to remember"
            />
            <StatCard
                icon={Target}
                label="Avg. accuracy"
                value={hasAccuracy ? `${summary.avgAccuracy}%` : "—"}
            />
            <StatCard
                icon={CalendarCheck}
                label="Active days"
                value={summary.activeDays.toLocaleString()}
                hint={`${summary.goalMetDays.toLocaleString()} on goal`}
            />
        </div>
    );
}
