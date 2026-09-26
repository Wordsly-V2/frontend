"use client";

import { EmptyState, ErrorState, Skeleton } from "@/components/common/states";
import { PlacementPlayer } from "@/components/features/path/placement/placement-player";
import { Button } from "@/components/ui/button";
import { usePathMeQuery, usePathPlacementQuery, usePathTreeQuery } from "@/queries/path.query";
import { Compass } from "lucide-react";
import Link from "next/link";

/** /path/placement: loads the test (online only), then hands it to the player. */
export function PathPlacementScreen() {
    const placement = usePathPlacementQuery();
    const tree = usePathTreeQuery();
    const me = usePathMeQuery();

    if ((!placement.data && placement.isFetching) || (!tree.data && tree.isFetching)) {
        return (
            <div aria-busy className="space-y-5">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-96 w-full rounded-3xl" />
            </div>
        );
    }

    if (placement.data === null) {
        return (
            <EmptyState
                icon={Compass}
                title="No placement test yet"
                description="Start from the beginning: the first units go quickly if you already know them."
                action={
                    <Button variant="play" asChild>
                        <Link href="/path">Back to the path</Link>
                    </Button>
                }
            />
        );
    }

    if (!placement.data) {
        return (
            <ErrorState
                message="Couldn't load the placement test. It needs a connection."
                onRetry={() => void placement.refetch()}
            />
        );
    }

    return (
        <PlacementPlayer
            key={placement.data.releaseId}
            placement={placement.data}
            tree={tree.data ?? null}
            me={me.data}
            onReload={() => void placement.refetch()}
        />
    );
}
