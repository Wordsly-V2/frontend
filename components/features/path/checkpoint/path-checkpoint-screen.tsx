"use client";

import { EmptyState, ErrorState, Skeleton } from "@/components/common/states";
import { CheckpointPlayer } from "@/components/features/path/checkpoint/checkpoint-player";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-error";
import { pathUnitHref } from "@/lib/path/path-tree";
import { usePathCheckpointQuery } from "@/queries/path.query";
import { Lock } from "lucide-react";
import Link from "next/link";

/** /path/checkpoint/[unitId]: loads the unit test, then hands it to the player. */
export function PathCheckpointScreen({ unitId }: Readonly<{ unitId: string }>) {
    const checkpoint = usePathCheckpointQuery(unitId);

    if (!checkpoint.data && checkpoint.isFetching) {
        return (
            <div aria-busy className="space-y-5">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-96 w-full rounded-3xl" />
            </div>
        );
    }

    if (!checkpoint.data) {
        const status = checkpoint.error instanceof ApiError ? checkpoint.error.status : undefined;
        const back = (
            <Button variant="play" asChild>
                <Link href={pathUnitHref(unitId)}>Back to the unit</Link>
            </Button>
        );
        if (status === 403) {
            return (
                <EmptyState
                    icon={Lock}
                    title="The unit test is locked"
                    description="Finish every lesson of the unit to take it."
                    action={back}
                />
            );
        }
        if (status === 404) {
            return (
                <EmptyState
                    title="Unit test not found"
                    description="This unit may have no test in the current version of the path."
                    action={
                        <Button variant="play" asChild>
                            <Link href="/path">Back to the path</Link>
                        </Button>
                    }
                />
            );
        }
        return (
            <ErrorState
                message="Couldn't load the unit test. It needs a connection."
                onRetry={() => void checkpoint.refetch()}
            />
        );
    }

    return (
        <CheckpointPlayer
            key={checkpoint.data.releaseId}
            checkpoint={checkpoint.data}
            onReload={() => void checkpoint.refetch()}
        />
    );
}
