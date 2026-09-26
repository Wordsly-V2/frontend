"use client";

import { StatTiles, type StatsCardItem } from "@/components/common/stats-cards";
import { ErrorState } from "@/components/common/states";
import { useAdminUserStatsQuery } from "@/queries/admin-users.query";
import { ArrowRight, Route, ShieldCheck, UserPlus, Users, UserX } from "lucide-react";
import Link from "next/link";

/** /admin: headline numbers and the way into each area. Charts arrive with the reports. */
export function AdminDashboard() {
    const stats = useAdminUserStatsQuery();
    const data = stats.data;

    const tiles: StatsCardItem[] = [
        { id: "users", label: "Accounts", value: data?.totals.users ?? 0, icon: <Users />, iconClassName: "gradient-brand" },
        {
            id: "new",
            label: "New in the last 30 days",
            value: data?.newUsers ?? 0,
            icon: <UserPlus />,
            iconClassName: "gradient-success",
        },
        { id: "admins", label: "Admins", value: data?.totals.admins ?? 0, icon: <ShieldCheck />, iconClassName: "gradient-accent" },
        { id: "suspended", label: "Suspended", value: data?.totals.suspended ?? 0, icon: <UserX />, iconClassName: "gradient-warm" },
    ];

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">How Wordsly is doing, at a glance.</p>
            </header>

            {!data && !stats.isFetching ? (
                <ErrorState message="Couldn't load the numbers." onRetry={() => void stats.refetch()} />
            ) : (
                <StatTiles
                    items={tiles}
                    isLoading={!data && stats.isFetching}
                    className="sm:grid-cols-2 xl:grid-cols-4"
                />
            )}

            <section className="grid gap-4 sm:grid-cols-2">
                <AreaLink
                    href="/admin/users"
                    icon={<Users className="h-5 w-5" />}
                    title="Users"
                    description="Find an account, change its role, suspend it or sign it out."
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
