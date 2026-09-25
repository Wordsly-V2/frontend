"use client";

import { EmptyState, ErrorState, Skeleton } from "@/components/common/states";
import { DailyPlanCard } from "@/components/features/path/daily-plan-card";
import { PathHero } from "@/components/features/path/path-hero";
import { PathMap } from "@/components/features/path/path-map";
import { usePathMeQuery, usePathTreeQuery } from "@/queries/path.query";
import { Map as MapIcon } from "lucide-react";

/** /path: the hero (start or continue) above the whole map. */
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

    return (
        <>
            <PathHero tree={tree.data} me={me.data} />
            <DailyPlanCard tree={tree.data} me={me.data} />
            <PathMap tree={tree.data} me={me.data} />
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
