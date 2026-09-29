"use client";

import { StatTiles, type StatsCardItem } from "@/components/common/stats-cards";
import { Skeleton } from "@/components/common/states";
import { FilterToggle } from "@/components/features/admin/filter-toggle";
import { MiniTable, SectionGate } from "@/components/features/admin-reports/report-parts";
import { ActivityHeatmapView } from "@/components/features/progress/activity-heatmap";
import { hasPathActivity, PathProgressCard } from "@/components/features/progress/path-progress-card";
import { ReportRangeNav } from "@/components/features/progress/report-range-nav";
import { ReportSummaryCards } from "@/components/features/progress/report-summary-cards";
import { Button } from "@/components/ui/button";
import {
    affectedTotal,
    cardRows,
    daysAgo,
    describeLearningReset,
    formatDay,
    LEARNING_RESET_CHOICES,
    type LearningResetChoiceId,
} from "@/lib/admin/learners";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import { localDateString } from "@/lib/daily-habit";
import { clampReportOffset } from "@/lib/search-params/progress";
import {
    useLearnerActivityCalendarQuery,
    useLearnerOverviewQuery,
    useLearnerReportQuery,
    useResetLearnerLearningMutation,
} from "@/queries/admin-learners.query";
import type { LearnerOverview } from "@/types/admin-learners/admin-learners.type";
import { CalendarClock, Flame, Layers, RotateCcw, Trophy } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";
import { ActionRow, DetailSection, Fact, Facts } from "./detail-parts";
import { ResetDialog } from "./reset-dialog";

function ChartSkeleton() {
    return <Skeleton className="h-[330px] w-full rounded-2xl" />;
}

// The learner's own /progress charts, code-split the same way.
const WordsOverTimeChart = dynamic(
    () => import("@/components/features/progress/words-over-time-chart").then((m) => m.WordsOverTimeChart),
    { ssr: false, loading: () => <ChartSkeleton /> },
);
const AccuracyTrendChart = dynamic(
    () => import("@/components/features/progress/accuracy-trend-chart").then((m) => m.AccuracyTrendChart),
    { ssr: false, loading: () => <ChartSkeleton /> },
);
const ConsistencyChart = dynamic(
    () => import("@/components/features/progress/consistency-chart").then((m) => m.ConsistencyChart),
    { ssr: false, loading: () => <ChartSkeleton /> },
);
const MasteryBreakdownChart = dynamic(
    () => import("@/components/features/progress/mastery-breakdown-chart").then((m) => m.MasteryBreakdownChart),
    { ssr: false, loading: () => <ChartSkeleton /> },
);

/** The Learning tab: what learning-service knows about one learner, and resets. */
export function LearnerLearningTab({ userLoginId, name }: Readonly<{ userLoginId: string; name: string }>) {
    const overview = useLearnerOverviewQuery(userLoginId);

    return (
        <div className="space-y-6">
            <SectionGate data={overview.data} isFetching={overview.isFetching} onRetry={() => void overview.refetch()}>
                {(data) => <OverviewSection overview={data} />}
            </SectionGate>
            <MonthReport userLoginId={userLoginId} />
            <Heatmap userLoginId={userLoginId} />
            <LearningReset userLoginId={userLoginId} name={name} />
        </div>
    );
}

function OverviewSection({ overview }: Readonly<{ overview: LearnerOverview }>) {
    const { habit, level, cards } = overview;
    const due = cards.reduce((sum, c) => sum + c.due, 0);
    const tiles: StatsCardItem[] = [
        {
            id: "streak",
            label: habit && habit.streak > 0 && !habit.streakAlive ? "Day streak (lapsed)" : "Day streak",
            // A stored streak whose last practice is over 2 days old is over.
            value: habit?.streakAlive ? habit.streak : 0,
            icon: <Flame />,
            iconClassName: "gradient-warm",
        },
        {
            id: "level",
            label: `Level · ${level.totalXp.toLocaleString()} XP`,
            value: level.level,
            icon: <Trophy />,
            iconClassName: "gradient-brand",
        },
        { id: "due", label: "Cards due now", value: due, icon: <Layers />, iconClassName: "gradient-accent" },
        {
            id: "active",
            label: "Last active",
            value: daysAgo(overview.lastActiveDate, localDateString()),
            icon: <CalendarClock />,
            iconClassName: "gradient-success",
        },
    ];
    const rows = cardRows(cards);

    return (
        <div className="space-y-4">
            <StatTiles items={tiles} className="grid-cols-2 sm:grid-cols-2 xl:grid-cols-4" />
            <DetailSection title="Habit">
                {habit ? (
                    <Facts>
                        <Fact label="Longest streak">{habit.longestStreak} days</Fact>
                        <Fact label="Days practised">{habit.totalPracticeDays}</Fact>
                        <Fact label="Daily goal">{habit.dailyGoal} words</Fact>
                        <Fact label="Last practised">
                            {habit.lastPracticeDate ? formatDay(habit.lastPracticeDate) : "Never"}
                        </Fact>
                        <Fact label="Streak freezes">{habit.streakFreezes}</Fact>
                        <Fact label="Achievements">{overview.achievements}</Fact>
                    </Facts>
                ) : (
                    <p className="text-sm text-muted-foreground">No practice recorded yet.</p>
                )}
            </DetailSection>
            <DetailSection title="Review cards" description="Cards are the words and Path items on their review schedule.">
                <MiniTable
                    head={[
                        { label: "From" },
                        { label: "Cards", numeric: true },
                        { label: "Due", numeric: true },
                        { label: "Leeches", numeric: true },
                        { label: "Suspended", numeric: true },
                    ]}
                    rows={rows.map((r) => [
                        <span key="label" className={r.label === "Total" ? "font-medium" : undefined}>
                            {r.label}
                        </span>,
                        r.counts.cards.toLocaleString(),
                        r.counts.due.toLocaleString(),
                        r.counts.leeches.toLocaleString(),
                        r.counts.suspended.toLocaleString(),
                    ])}
                    empty="No cards yet."
                />
            </DetailSection>
        </div>
    );
}

/** The month report, exactly as the learner sees it on /progress. */
function MonthReport({ userLoginId }: Readonly<{ userLoginId: string }>) {
    const [offset, setOffset] = useState(0);
    const report = useLearnerReportQuery(userLoginId, "month", offset);
    const data = report.data;

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="font-semibold">Learning report</h2>
                    <p className="text-sm text-muted-foreground">Their /progress page, by month. Days are your calendar days.</p>
                </div>
                {data ? (
                    <ReportRangeNav
                        period="month"
                        range={data.range}
                        offset={offset}
                        onChange={(next) => setOffset(clampReportOffset(next))}
                    />
                ) : null}
            </div>
            <SectionGate data={data} isFetching={report.isFetching} onRetry={() => void report.refetch()}>
                {(r) => (
                    <>
                        <ReportSummaryCards summary={r.summary} hasAccuracy={r.buckets.some((b) => b.reviews > 0)} />
                        {hasPathActivity(r.path) ? <PathProgressCard path={r.path} showActions={false} /> : null}
                        <div className="grid gap-4 lg:grid-cols-2">
                            <WordsOverTimeChart
                                buckets={r.buckets}
                                granularity={r.granularity}
                                newWords={r.summary.newWords}
                                reviewedWords={r.summary.reviewedWords}
                            />
                            <AccuracyTrendChart
                                buckets={r.buckets}
                                granularity={r.granularity}
                                avgAccuracy={r.summary.avgAccuracy}
                            />
                            <ConsistencyChart
                                buckets={r.buckets}
                                granularity={r.granularity}
                                streaks={r.streaks}
                                activeDays={r.summary.activeDays}
                                goalMetDays={r.summary.goalMetDays}
                            />
                            <MasteryBreakdownChart mastery={r.mastery} />
                        </div>
                    </>
                )}
            </SectionGate>
        </section>
    );
}

function Heatmap({ userLoginId }: Readonly<{ userLoginId: string }>) {
    const calendar = useLearnerActivityCalendarQuery(userLoginId);
    return <ActivityHeatmapView data={calendar.data} isLoading={calendar.isLoading} subject="they" />;
}

function LearningReset({ userLoginId, name }: Readonly<{ userLoginId: string; name: string }>) {
    const [choiceId, setChoiceId] = useState<LearningResetChoiceId>("cards");
    const [confirming, setConfirming] = useState(false);
    const reset = useResetLearnerLearningMutation();
    const { choice } = LEARNING_RESET_CHOICES.find((c) => c.id === choiceId) ?? LEARNING_RESET_CHOICES[0];
    const description = describeLearningReset(choice);

    const confirm = () =>
        reset.mutate(
            { userLoginId, ...choice },
            {
                onSuccess: ({ affected }) => {
                    const rows = affectedTotal(affected);
                    toast.success(`Reset ${description.name} for ${name} (${rows} ${rows === 1 ? "row" : "rows"})`);
                    setConfirming(false);
                },
                onError: (error) => toast.error(adminErrorMessages(error)[0]),
            },
        );

    return (
        <DetailSection title="Reset progress" description="For support cases: start part of their learning over.">
            <div className="space-y-4">
                <div className="overflow-x-auto">
                    <div className="w-max">
                        <FilterToggle
                            label="What to reset"
                            value={choiceId}
                            options={LEARNING_RESET_CHOICES.map((c) => ({ value: c.id, label: c.label }))}
                            onChange={(value) => value && setChoiceId(value)}
                        />
                    </div>
                </div>
                <ActionRow
                    title="This removes"
                    description={
                        <ul className="mt-1 list-disc space-y-0.5 pl-5">
                            {description.removes.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    }
                >
                    <Button variant="destructive" onClick={() => setConfirming(true)}>
                        <RotateCcw className="h-4 w-4" />
                        Reset {description.name}
                    </Button>
                </ActionRow>
            </div>
            {confirming ? (
                <ResetDialog
                    title={`Reset ${description.name} for ${name}?`}
                    reset={description}
                    onClose={() => setConfirming(false)}
                    onConfirm={confirm}
                    isLoading={reset.isPending}
                />
            ) : null}
        </DetailSection>
    );
}
