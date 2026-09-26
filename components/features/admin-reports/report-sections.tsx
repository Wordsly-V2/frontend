"use client";

import { StatTiles } from "@/components/common/stats-cards";
import { AdminBarChart, AdminPercentLineChart } from "@/components/features/admin/charts";
import { ChartCard } from "@/components/features/progress/chart-card";
import { Badge } from "@/components/ui/badge";
import { dailyAccuracy, formatPercent, ratio, retentionShade, shortDay } from "@/lib/admin/stats";
import { useAdminLearningStatsQuery, useAdminPathStatsQuery, useHardestPathItemsQuery } from "@/queries/admin-stats.query";
import { useAdminUserStatsQuery } from "@/queries/admin-users.query";
import type { DateRange, RetentionCohort } from "@/types/admin-stats/admin-stats.type";
import {
    Activity,
    BookOpenCheck,
    CalendarCheck,
    CheckCircle2,
    Compass,
    Layers,
    Repeat,
    Sparkles,
    Target,
    UserPlus,
    Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MiniTable, SectionGate } from "./report-parts";

const daily = <T extends { date: string }>(rows: T[], pick: (row: T) => number) =>
    rows.map((row) => ({ label: shortDay(row.date), value: pick(row) }));

const SOURCE_LABELS: Record<string, string> = { VOCAB: "My words", PATH: "Wordsly Path" };

/** Sign-ups, active learners and whether they come back. */
export function GrowthReport({ range }: Readonly<{ range: DateRange }>) {
    const users = useAdminUserStatsQuery(range);
    const learning = useAdminLearningStatsQuery(range);
    const data = users.data && learning.data ? { users: users.data, learning: learning.data } : undefined;

    return (
        <SectionGate
            data={data}
            isFetching={users.isFetching || learning.isFetching}
            onRetry={() => void Promise.all([users.refetch(), learning.refetch()])}
        >
            {({ users: u, learning: l }) => (
                <>
                    <StatTiles
                        className="sm:grid-cols-2 xl:grid-cols-4"
                        items={[
                            { id: "new", label: "New accounts", value: u.newUsers, icon: <UserPlus />, iconClassName: "gradient-success" },
                            { id: "active", label: "Learners active in range", value: l.activeInRange, icon: <Users />, iconClassName: "gradient-brand" },
                            { id: "week", label: "Active in the last 7 days", value: l.weeklyActive, icon: <Activity />, iconClassName: "gradient-accent" },
                            { id: "month", label: "Active in the last 30 days", value: l.monthlyActive, icon: <CalendarCheck />, iconClassName: "gradient-warm" },
                        ]}
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                        <ChartCard title="Sign-ups per day" subtitle={`${u.newUsers} new accounts · UTC days`}>
                            <AdminBarChart data={daily(u.signups, (d) => d.count)} valueName="Sign-ups" />
                        </ChartCard>
                        <ChartCard title="Active learners per day" subtitle="Practised or answered at least once">
                            <AdminBarChart data={daily(l.daily, (d) => d.activeLearners)} valueName="Learners" />
                        </ChartCard>
                    </div>
                    <ChartCard
                        title="Weekly retention"
                        subtitle="Learners grouped by the week they first practised: the share who practised again each week after"
                    >
                        <RetentionTable cohorts={l.retention} />
                    </ChartCard>
                </>
            )}
        </SectionGate>
    );
}

function RetentionTable({ cohorts }: Readonly<{ cohorts: RetentionCohort[] }>) {
    if (cohorts.length === 0) {
        return <p className="py-6 text-center text-sm text-muted-foreground">No one started in this range.</p>;
    }
    const weeks = Math.max(...cohorts.map((c) => c.weeks.length));
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0.5 text-xs">
                <thead>
                    <tr className="text-muted-foreground">
                        <th className="px-2 py-1.5 text-left font-medium">Week of</th>
                        <th className="px-2 py-1.5 text-right font-medium">Learners</th>
                        {Array.from({ length: weeks }, (_, w) => (
                            <th key={w} className="px-2 py-1.5 text-center font-medium">
                                W{w}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {cohorts.map((cohort) => (
                        <tr key={cohort.cohort}>
                            <td className="whitespace-nowrap px-2 py-1.5">{shortDay(cohort.cohort)}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{cohort.size}</td>
                            {Array.from({ length: weeks }, (_, w) => {
                                const value = cohort.weeks[w];
                                return value === undefined ? (
                                    <td key={w} />
                                ) : (
                                    <td
                                        key={w}
                                        title={`Week ${w}: ${formatPercent(value)} of ${cohort.size}`}
                                        className={cn(
                                            "rounded-md px-2 py-1.5 text-center tabular-nums",
                                            // Text tokens only: the strong end of the ramp flips to the on-primary ink.
                                            retentionShade(value) > 0.5 ? "text-primary-foreground" : "text-foreground",
                                        )}
                                        style={{
                                            background: `color-mix(in oklch, var(--chart-1) ${retentionShade(value) * 100}%, transparent)`,
                                        }}
                                    >
                                        {formatPercent(value)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/** Reviews, accuracy, new words, streaks, levels, cards. */
export function LearningReport({ range }: Readonly<{ range: DateRange }>) {
    const learning = useAdminLearningStatsQuery(range);

    return (
        <SectionGate data={learning.data} isFetching={learning.isFetching} onRetry={() => void learning.refetch()}>
            {(l) => {
                const accuracy = ratio(l.totals.correctReviews, l.totals.reviews);
                const due = l.cards.reduce((sum, c) => sum + c.due, 0);
                return (
                    <>
                        <StatTiles
                            className="sm:grid-cols-2 xl:grid-cols-4"
                            items={[
                                { id: "reviews", label: "Answers in range", value: l.totals.reviews, icon: <Repeat />, iconClassName: "gradient-brand" },
                                {
                                    id: "accuracy",
                                    label: `Correct answers (${formatPercent(accuracy)})`,
                                    value: l.totals.correctReviews,
                                    icon: <Target />,
                                    iconClassName: "gradient-success",
                                },
                                { id: "new", label: "New words started", value: l.totals.newWords, icon: <Sparkles />, iconClassName: "gradient-accent" },
                                { id: "due", label: "Cards due right now", value: due, icon: <Layers />, iconClassName: "gradient-warm" },
                            ]}
                        />
                        <div className="grid gap-4 md:grid-cols-2">
                            <ChartCard title="Answers per day" subtitle="Every answer in practice and reviews">
                                <AdminBarChart data={daily(l.daily, (d) => d.reviews)} valueName="Answers" />
                            </ChartCard>
                            <ChartCard title="Accuracy per day" subtitle={`${formatPercent(accuracy)} over the range`}>
                                <AdminPercentLineChart
                                    data={dailyAccuracy(l.daily).map((d) => ({ label: shortDay(d.date), value: d.value }))}
                                    valueName="Accuracy"
                                />
                            </ChartCard>
                            <ChartCard title="New words per day" subtitle="Words and Path items seen for the first time">
                                <AdminBarChart data={daily(l.daily, (d) => d.newWords)} valueName="New words" />
                            </ChartCard>
                            <ChartCard title="Current streaks" subtitle="Learners by streak length, in days; broken streaks count as 0">
                                <AdminBarChart
                                    data={l.streaks.map((s) => ({ label: s.label, value: s.learners, hint: `${s.label} days` }))}
                                    valueName="Learners"
                                />
                            </ChartCard>
                            <ChartCard title="Levels" subtitle="Learners at each level">
                                <AdminBarChart
                                    data={l.levels.map((lv) => ({ label: String(lv.level), value: lv.learners, hint: `Level ${lv.level}` }))}
                                    valueName="Learners"
                                />
                            </ChartCard>
                            <ChartCard title="Cards" subtitle="Spaced-repetition cards across all learners">
                                <MiniTable
                                    head={[{ label: "Source" }, { label: "Cards", numeric: true }, { label: "Due now", numeric: true }]}
                                    rows={l.cards.map((c) => [
                                        SOURCE_LABELS[c.source] ?? c.source,
                                        c.cards.toLocaleString(),
                                        c.due.toLocaleString(),
                                    ])}
                                    empty="No cards yet."
                                />
                            </ChartCard>
                        </div>
                    </>
                );
            }}
        </SectionGate>
    );
}

/** Enrollments, where learners are, how far they get, checkpoints, placement. */
export function PathReport({ range }: Readonly<{ range: DateRange }>) {
    const path = useAdminPathStatsQuery(range);

    return (
        <SectionGate data={path.data} isFetching={path.isFetching} onRetry={() => void path.refetch()}>
            {(p) => {
                const completed = p.completionsPerDay.reduce((sum, d) => sum + d.count, 0);
                return (
                    <>
                        <StatTiles
                            className="sm:grid-cols-2 xl:grid-cols-4"
                            items={[
                                { id: "enrolled", label: "Enrolled learners", value: p.enrollments.total, icon: <Users />, iconClassName: "gradient-brand" },
                                { id: "new", label: "New enrollments", value: p.enrollments.newInRange, icon: <UserPlus />, iconClassName: "gradient-success" },
                                { id: "lessons", label: "Lessons finished (first time)", value: completed, icon: <BookOpenCheck />, iconClassName: "gradient-accent" },
                                { id: "placement", label: "Placement tests taken", value: p.placement.results, icon: <Compass />, iconClassName: "gradient-warm" },
                            ]}
                        />
                        <p className="text-xs text-muted-foreground">
                            {p.release ? `Measured against the live release, v${p.release.version}.` : "Nothing is published yet."} Days are UTC.
                        </p>
                        <div className="grid gap-4 md:grid-cols-2">
                            <ChartCard title="Enrollments per day">
                                <AdminBarChart data={daily(p.enrollments.perDay, (d) => d.count)} valueName="Enrollments" />
                            </ChartCard>
                            <ChartCard title="Lessons finished per day" subtitle="First completion of each lesson">
                                <AdminBarChart data={daily(p.completionsPerDay, (d) => d.count)} valueName="Lessons" />
                            </ChartCard>
                            <ChartCard title="Where learners are" subtitle="Stage of the furthest lesson each enrolled learner has finished">
                                <AdminBarChart
                                    data={p.stages.map((s) => ({ label: cefrLabel(s.cefr), value: s.learners, hint: `${cefrLabel(s.cefr)} · ${s.title}` }))}
                                    valueName="Learners"
                                />
                            </ChartCard>
                            <ChartCard title="Placement results" subtitle={`Stage each learner's latest placement put them in (${p.placement.learners} learners)`}>
                                <AdminBarChart
                                    data={p.placement.byStage.map((s) => ({ label: cefrLabel(s.cefr), value: s.learners }))}
                                    valueName="Learners"
                                />
                            </ChartCard>
                        </div>
                        <ChartCard title="Lesson funnel" subtitle="Learners who have finished each lesson, in path order; a steep drop marks a lesson worth a look">
                            <AdminBarChart
                                height={260}
                                data={p.funnel.map((l) => ({
                                    label: String(l.position),
                                    value: l.learners,
                                    hint: `${l.position}. ${l.title} · ${l.unitTitle} (${cefrLabel(l.cefr)})`,
                                }))}
                                valueName="Learners"
                            />
                        </ChartCard>
                        <ChartCard title="Checkpoints" subtitle="Unit tests: attempts and how many pass">
                            <MiniTable
                                head={[
                                    { label: "Unit" },
                                    { label: "Attempts", numeric: true },
                                    { label: "Pass rate", numeric: true },
                                    { label: "Learners passed", numeric: true },
                                ]}
                                rows={p.checkpoints.map((c) => [
                                    c.unitTitle,
                                    c.attempts,
                                    formatPercent(ratio(c.passedAttempts, c.attempts)),
                                    `${c.passedLearners} of ${c.learners}`,
                                ])}
                                empty="No checkpoint attempts yet."
                            />
                        </ChartCard>
                    </>
                );
            }}
        </SectionGate>
    );
}

/** What learners find hardest. Vocabulary content health joins this later. */
export function ContentReport() {
    const hardest = useHardestPathItemsQuery({ limit: 20, minLearners: 3 });

    return (
        <SectionGate data={hardest.data} isFetching={hardest.isFetching} onRetry={() => void hardest.refetch()}>
            {(items) => (
                <ChartCard
                    title="Hardest Wordsly Path items"
                    subtitle="Lowest accuracy across all learners, among items at least 3 learners have answered; all time"
                >
                    <MiniTable
                        head={[
                            { label: "Item" },
                            { label: "Unit" },
                            { label: "Learners", numeric: true },
                            { label: "Accuracy", numeric: true },
                            { label: "Lapses", numeric: true },
                        ]}
                        rows={items.map((h) => [
                            h.item ? (
                                <span key="item" className="block min-w-40">
                                    <span className="font-medium">{h.item.text}</span>
                                    <span className="block text-xs text-muted-foreground">{h.item.meaningVi}</span>
                                    {h.item.status === "ARCHIVED" ? (
                                        <Badge variant="muted" className="mt-1">
                                            archived
                                        </Badge>
                                    ) : null}
                                </span>
                            ) : (
                                <span key="item" className="font-mono text-xs text-muted-foreground">
                                    {h.itemId.slice(0, 8)}
                                </span>
                            ),
                            h.item?.unitTitle ?? "–",
                            h.learners,
                            formatPercent(h.accuracy),
                            h.lapses,
                        ])}
                        empty="Not enough answers yet: items show up once 3 learners have answered them."
                    />
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Edit an item from Wordsly Path content to fix its wording or examples.
                    </p>
                </ChartCard>
            )}
        </SectionGate>
    );
}

function cefrLabel(cefr: string): string {
    return cefr === "PRE_A1" ? "Pre-A1" : cefr;
}
