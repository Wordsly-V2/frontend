"use client";

import { PageHeader } from "@/components/common/page";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/states";
import { DailyPlanCard } from "@/components/features/path/daily-plan-card";
import { PathHero } from "@/components/features/path/path-hero";
import { PathMap } from "@/components/features/path/path-map";
import { usePathMeQuery, usePathTreeQuery } from "@/queries/path.query";
import { Map as MapIcon } from "lucide-react";

/** /path: the hero (start or continue) and today's plan beside the whole map. */
export function PathOverview() {
    const tree = usePathTreeQuery();
    const me = usePathMeQuery();

    // Gate on data, not on fetch outcome: offline, restored cache comes with
    // isError set.
    if ((!tree.data && tree.isFetching) || (!me.data && me.isFetching)) {
        return <PathOverviewSkeleton />;
    }

    if (tree.data === null) {
        return (
            <EmptyState
                icon={MapIcon}
                title="The path is on its way"
                description="Lessons haven't been published yet. Check back soon!"
            />
        );
    }

    if (!tree.data || !me.data) {
        return (
            <ErrorState
                message="Couldn't load the path."
                onRetry={() => {
                    void tree.refetch();
                    void me.refetch();
                }}
            />
        );
    }

    // From lg the map gets the main column and the hero and today's plan stay
    // beside it as a rail; on one column they lead, as before.
    return (
        <>
        <PageHeader
            className="hidden lg:block"
            title="Wordsly Path"
            description="From your first words to real conversations, one short lesson at a time."
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
            <aside className="min-w-0 space-y-5 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:self-start">
                <PathHero tree={tree.data} me={me.data} />
                <DailyPlanCard tree={tree.data} me={me.data} />
            </aside>
            <div className="min-w-0 lg:col-start-1 lg:row-start-1">
                <PathMap tree={tree.data} me={me.data} />
            </div>
        </div>
        </>
    );
}

function PathOverviewSkeleton() {
    return (
        <div aria-busy className="space-y-6">
            <Skeleton className="h-56 w-full rounded-3xl" />
            <Skeleton className="h-6 w-48" />
            {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
        </div>
    );
}
