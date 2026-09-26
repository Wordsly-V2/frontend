"use client";

import { StatTiles, type StatsCardItem } from "@/components/common/stats-cards";
import { ErrorState } from "@/components/common/states";
import { AdminBarChart } from "@/components/features/admin/charts";
import { ChartCard } from "@/components/features/progress/chart-card";
import { lastDays, shortDay } from "@/lib/admin/stats";
import { useAdminLearningStatsQuery } from "@/queries/admin-stats.query";
import { useAdminUserStatsQuery } from "@/queries/admin-users.query";
import {
    Activity,
    ArrowRight,
    BarChart3,
    CalendarCheck,
    Repeat,
    Route,
    ShieldCheck,
    UserPlus,
    Users,
    UserX,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

/** /admin: the last 30 days at a glance, and the way into each area. */
export function AdminDashboard() {
    const range = useMemo(() => lastDays(30), []);
    const users = useAdminUserStatsQuery(range);
    const learning = useAdminLearningStatsQuery(range);
    const u = users.data;
    const l = learning.data;

    const people: StatsCardItem[] = [
        { id: "users", label: "Accounts", value: u?.totals.users ?? 0, icon: <Users />, iconClassName: "gradient-brand" },
        { id: "new", label: "New in the last 30 days", value: u?.newUsers ?? 0, icon: <UserPlus />, iconClassName: "gradient-success" },
        { id: "admins", label: "Admins", value: u?.totals.admins ?? 0, icon: <ShieldCheck />, iconClassName: "gradient-accent" },
        { id: "suspended", label: "Suspended", value: u?.totals.suspended ?? 0, icon: <UserX />, iconClassName: "gradient-warm" },
    ];
    const activity: StatsCardItem[] = [
        { id: "today", label: "Learners active today", value: l?.activeToday ?? 0, icon: <Zap />, iconClassName: "gradient-brand" },
        { id: "week", label: "Active in the last 7 days", value: l?.weeklyActive ?? 0, icon: <Activity />, iconClassName: "gradient-success" },
        { id: "month", label: "Active in the last 30 days", value: l?.monthlyActive ?? 0, icon: <CalendarCheck />, iconClassName: "gradient-accent" },
        { id: "answers", label: "Answers in the last 30 days", value: l?.totals.reviews ?? 0, icon: <Repeat />, iconClassName: "gradient-warm" },
    ];

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">How Wordsly is doing, at a glance.</p>
            </header>

            <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground">People</h2>
                {!u && !users.isFetching ? (
                    <ErrorState message="Couldn't load the account numbers." onRetry={() => void users.refetch()} />
                ) : (
                    <StatTiles items={people} isLoading={!u && users.isFetching} className="sm:grid-cols-2 xl:grid-cols-4" />
                )}
            </section>

            <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground">Learning</h2>
                {!l && !learning.isFetching ? (
                    <ErrorState message="Couldn't load the learning numbers." onRetry={() => void learning.refetch()} />
                ) : (
                    <StatTiles items={activity} isLoading={!l && learning.isFetching} className="sm:grid-cols-2 xl:grid-cols-4" />
                )}
            </section>

            {u && l ? (
                <section className="grid gap-4 md:grid-cols-2">
                    <ChartCard title="Active learners per day" subtitle="Last 30 days">
                        <AdminBarChart
                            data={l.daily.map((d) => ({ label: shortDay(d.date), value: d.activeLearners }))}
                            valueName="Learners"
                        />
                    </ChartCard>
                    <ChartCard title="Sign-ups per day" subtitle="Last 30 days · UTC">
                        <AdminBarChart
                            data={u.signups.map((d) => ({ label: shortDay(d.date), value: d.count }))}
                            valueName="Sign-ups"
                        />
                    </ChartCard>
                </section>
            ) : null}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <AreaLink
                    href="/admin/users"
                    icon={<Users className="h-5 w-5" />}
                    title="Users"
                    description="Find an account, change its role, suspend it or sign it out."
                />
                <AreaLink
                    href="/admin/reports"
                    icon={<BarChart3 className="h-5 w-5" />}
                    title="Reports"
                    description="Growth, retention, learning activity, the Path funnel and hard items."
                />
                <AreaLink
                    href="/admin/path"
                    icon={<Route className="h-5 w-5" />}
                    title="Wordsly Path"
                    description="Edit the curriculum, check it and publish a release."
                />
            </section>
        </div>
    );
}

function AreaLink({
    href,
    icon,
    title,
    description,
}: Readonly<{ href: string; icon: React.ReactNode; title: string; description: string }>) {
    return (
        <Link
            href={href}
            className="group flex items-start gap-4 rounded-2xl border border-border/80 bg-card p-5 transition-colors hover:border-primary/30"
        >
            <span className="rounded-xl bg-primary/10 p-2.5 text-primary">{icon}</span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 font-semibold">
                    {title}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
            </span>
        </Link>
    );
}
